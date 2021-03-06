pip install --upgrade git+https://github.com/m-wrzr/populartimes

import json
import urllib.request as url_req
import time
import pandas as pd
import populartimes
import requests
from collections import defaultdict
from google.colab import drive

#list of nearby places with popular times

LOCATION = (27.2038,77.5011)
API_KEY = ''
API_NEARBY_SEARCH_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json'
RADIUS = 30000
PLACES_TYPES = [('airport', 1), ('bank', 2), ('bar', 3), ('beauty_salon', 3), ('book_store', 1), ('cafe', 1), ('church', 3), ('doctor', 3), ('dentist', 2), ('gym', 3), ('hair_care', 3), ('hospital', 2), ('pharmacy', 3), ('pet_store', 1), ('night_club', 2), ('movie_theater', 1), ('school', 3), ('shopping_mall', 1), ('supermarket', 3), ('store', 3)]

def request_api(url):
    response = url_req.urlopen(url)
    json_raw = response.read()
    json_data = json.loads(json_raw)
    return json_data

def get_places(types, pages):
    location = str(LOCATION[0]) + "," + str(LOCATION[1])
    mounted_url = ('%s'
        '?location=%s'
        '&radius=%s'
        '&type=%s'
        '&key=%s') % (API_NEARBY_SEARCH_URL, location, RADIUS, types, API_KEY)
    
    results = []
    next_page_token = None

    if pages == None: pages = 1

    for num_page in range(pages):
        if num_page == 0:
            api_response = request_api(mounted_url)
            results = results + api_response['results']
        else:
            page_url = ('%s'
                '?key=%s'
                '&pagetoken=%s') % (API_NEARBY_SEARCH_URL, API_KEY, next_page_token)
            api_response = request_api(str(page_url))
            results += api_response['results']

        if 'next_page_token' in api_response:
            next_page_token = api_response['next_page_token']
        else: break
        
        time.sleep(3)
    return results

def parse_place_to_list(place, type_name):
    # Using name, place_id, lat, lng, rating, type_name
    return [
        place['name'],
        place['place_id'],
        place['geometry']['location']['lat'],
        place['geometry']['location']['lng'],
        type_name       
    ]

def mount_dataset():
    data = []

    for place_type in PLACES_TYPES:
        type_name = place_type[0]
        type_pages = place_type[1]
        result = get_places(type_name, type_pages)
        result_parsed = list(map(lambda x: parse_place_to_list(x, type_name), result))
        data += result_parsed
    
    places = pd.DataFrame(data, columns=['place_name', 'place_id', 'lat', 'lng', 'type'])
    places['monday'] = None
    places['tuesday'] = None
    places['wednesday'] = None
    places['thursday'] = None
    places['friday'] = None
    places['saturday'] = None
    places['sunday'] = None

    return places

def get_place_popular_moments(place_id):
    popular_moments = populartimes.get_id(API_KEY, place_id)
    if 'populartimes' in popular_moments:
        return popular_moments['populartimes']
    else:
        return None

def places_with_moments():
  places = mount_dataset()
  for (index, row) in places.iterrows():
      moments = get_place_popular_moments(row.place_id)
      if moments != None:
          places.at[index, 'monday'] = moments[0]['data']
          places.at[index, 'tuesday'] = moments[1]['data']
          places.at[index, 'wednesday'] = moments[2]['data']
          places.at[index, 'thursday'] = moments[3]['data']
          places.at[index, 'friday'] = moments[4]['data']
          places.at[index, 'saturday'] = moments[5]['data']
          places.at[index, 'sunday'] = moments[6]['data']
  return places

places_final = places_with_moments()
places_final.head()

