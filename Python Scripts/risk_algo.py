# -*- coding: utf-8 -*-

#libraries

import json
import urllib.request as url_req
import time
import pandas as pd
import requests
from collections import defaultdict
from google.colab import drive

import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

cred = credentials.Certificate('/path')
firebase_admin.initialize_app(cred, {
    'databaseURL' : 'enterurl.com'
})

def listener(event):
    print(event.event_type)  # can be 'put' or 'patch'
    print(event.path)  # relative to the reference, it seems
    print(event.data)  # new data at /reference/event.path. None if deleted

#pulling data from firebase

db.reference('users').listen(listener)
ref = db.reference('users')
user_db = ref.get()
response_full = next(iter( user_db.items() ))
response = response_full[1]

symptoms_df = pd.DataFrame.from_dict(response['symptoms'], orient='index', columns=['Value'])
conditions_df = pd.DataFrame.from_dict(response['riskFactor'], orient='index', columns=['Value'])
locations_df = pd.DataFrame.from_dict(response['location'], orient='index')
contacts_df = pd.DataFrame.from_dict(response['contactRef'], orient='index', columns=['Number'])

#Symptoms score

def symptoms(symp_df, sheetname):
  weights = pd.read_excel('weights.xlsx',sheet_name=sheetname, index_col=[0])
  joined = pd.merge(symp_df, weights, left_index=True, right_index=True)
  joined['weight_sq'] = joined['weight']**2
  joined['mult'] = joined['Value']*joined['weight_sq']
  symp_risk = joined['mult'].sum() / joined['weight_sq'].sum()
  return symp_risk
  
def age(sheetname, response):
  weights = pd.read_excel('weights.xlsx',sheet_name=sheetname)
  age = int(response['age'])
  age_weight = weights[(weights['upper'] >= age) & (weights['lower'] < age)]['weight'].iloc[0]
  age_weight_max = weights['weight'].max()
  age_list = [age_weight, age_weight_max]
  return age_list

def risk_factors(con_df, sheetname, response):
  age_weight, age_weight_max = age('age', response)
  weights = pd.read_excel('weights.xlsx',sheet_name=sheetname, index_col=[0])
  conditions_weight = con_df['Value'].max() * weights['weight'].iloc[0]
  risk_fact = (conditions_weight + age_weight) / (weights['weight'].iloc[0] + age_weight_max)
  return risk_fact

def symptom_score(symp_df, con_df, response):
  symp_score = 0.8*symptoms(symp_df, 'symptoms') + 0.2*risk_factors(con_df, 'conditions', response)
  return symp_score

def overall_risk(symp_df, con_df, response):
  final_risk = symptom_score(symp_df, con_df, response)
  return final_risk

#function for generating covid pass colour after referencing risk matrix

def covid_pass(score):
  if score < 0.4:
    return 'green'
  else:
    return 'yellow'

#calculating final risk score and pass color

risk_score = overall_risk(symptoms_df, conditions_df, response)
c_pass = covid_pass(risk_score)

#push data into firebase
user_ref = ref.child(response_full[0])
user_ref.update({
    'riskScore': risk_score,
    'passColor': c_pass
})

