// Initialize app
//var myApp = new Framework7();

// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

var app = new Framework7({
  root: "#app",
  name: "COVIDPass",
  id: "com.myapp.test",
  panel: {
    swipe: "left",
  },
  routes: routes,
});

var mainView = app.views.create(".view-main", {
  url: "/",
});

function googleTakeout() {
  app.dialog.alert("Thanks! We'll handle the rest.", function () {
    app.loginScreen.close();
  });
}
var firstName, lastName, email, password, confirmPassword, phone, gender, age;

function getPersonalDetails() {
  firstName = document.getElementById("firstName").value;
  lastName = document.getElementById("lastName").value;
  email = document.getElementById("email").value;
  password = document.getElementById("passwordNew").value;
  confirmPassword = document.getElementById("confirmPasswordNew").value;
  phone = document.getElementById("phone").value;
  gender = document.getElementById("gender").value;
  age = document.getElementById("age").value;

  const isEmail = validateEmail(email);

  if (firstName == "") {
    app.dialog.alert("Please enter your first name");
    return;
  }

  if (lastName == "") {
    app.dialog.alert("Please enter your last name");
    return;
  }

  if (isEmail == false) {
    app.dialog.alert("Incorrect Mail Format");
    return;
  }

  if (password != confirmPassword) {
    app.dialog.alert("Passwords don't match");
    return;
  }

  if (phone.length == 0) {
    app.dialog.alert("Please enter your phone number");
    return;
  }

  if (age.length == 0) {
    app.dialog.alert("Please enter your age");
    return;
  }

  app.router.navigate("/symptoms/");
}

var cough, bodyChills, breathShortness, fatigue, fever, headAche, runnyNose, soreThroat, sputum, stomachPain, tasteLoss;
var diabetes, compromisedImmunity, lungDisease, heartDisease;

function getSymptomsAndRisk() {
  cough = booleanConverter(document.getElementById("cough").checked);
  bodyChills = booleanConverter(document.getElementById("bodyChills").checked);
  breathShortness = booleanConverter(document.getElementById("breathShortness").checked);
  fatigue = booleanConverter(document.getElementById("fatigue").checked);
  fever = booleanConverter(document.getElementById("fever").checked);
  headAche = booleanConverter(document.getElementById("headAche").checked);
  runnyNose = booleanConverter(document.getElementById("runnyNose").checked);
  soreThroat = booleanConverter(document.getElementById("soreThroat").checked);
  sputum = booleanConverter(document.getElementById("sputum").checked);
  stomachPain = booleanConverter(document.getElementById("stomachPain").checked);
  tasteLoss = booleanConverter(document.getElementById("tasteLoss").checked);

  diabetes = booleanConverter(document.getElementById("diabetes").checked);
  compromisedImmunity = booleanConverter(document.getElementById("compromisedImmunity").checked);
  lungDisease = booleanConverter(document.getElementById("lungDisease").checked);
  heartDisease = booleanConverter(document.getElementById("heartDisease").checked);

  // app.router.back();
  app.router.navigate("/contactTracing/");
}

var refer1, refer2, refer3;

function booleanConverter(val) {
  let convertedValue = 0;

  if (val == true) convertedValue = 1;
  else convertedValue = 0;

  return convertedValue;
}

function register() {
  var passColor = "yellow";

  var contactRef = {
    refer1: 123,
    refer2: 123,
    refer3: 123,
  };

  var locationDetail = {
    latitude: "",
    longitude: "",
  };

  var location = {
    location1: locationDetail,
    location2: locationDetail,
  };

  var symptoms = {
    fever: fever,
    cough: cough,
    fatigue: fatigue,
    sputum: sputum,
    breathShortness: breathShortness,
    soreThroat: soreThroat,
    headAche: headAche,
    bodyChills: bodyChills,
    stomachPain: stomachPain,
    tasteLoss: tasteLoss,
    runnyNose: runnyNose,
  };

  var riskFactor = {
    diabetes: diabetes,
    heartDisease: heartDisease,
    lungDisease: lungDisease,
    compromisedImmunity: compromisedImmunity,
  };

  age = parseInt(age);

  var postData = {
    age: age,
    blueTrace: false,
    email: email,
    doctorResult: "",
    testResult: "",
    contactRef: contactRef,
    firstName: firstName,
    gender: gender,
    lastName: lastName,
    location: location,
    passColor: passColor,
    riskScore: 0,
    riskFactor: riskFactor,
    riskMessage: "You are at risk of having contracted COVID-19",
    symptoms: symptoms,
  };

  var mailData = {
    mail: email,
  };

  const auth = firebase.auth();
  let failedMessage = "";
  const promise = auth.createUserWithEmailAndPassword(email, password);
  promise.catch((e) => {
    console.log(e.message);
    failedMessage = e.message;
    app.dialog.alert("Failed:" + " \n" + failedMessage);
  });

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      // Get a key for a new Post.
      var updates = {};
      updates["/users/" + phone + "/"] = postData;
      updates["/uid/" + phone + "/"] = mailData;

      firebase.database().ref().update(updates);

      app.dialog.alert("Registered Successfully!", function () {
        app.loginScreen.close();
      });

      app.router.navigate("/allSet/");
    }
  });
}

function validateEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function logout() {
  firebase.auth().signOut();
  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      console.log("Still Logged In");
    } else {
      app.dialog.alert("Logged Out!", function () {
        app.loginScreen.close();
        app.router.navigate("/login/");
      });
    }
  });
}

let notifAlert = true;
// Handle Cordova Device Ready Event
$$(document).on("deviceready", function () {
  notificationFull.open();
});

let loggedInUser;
let loggedInUserNumber;

var selfScoreGauge;
$$(document).on("page:init", function (e) {
  selfScoreGauge = app.gauge.create({
    el: ".selfScore",
    type: "circle",
    value: 0,
    size: 250,
    borderColor: "#fff",
    borderWidth: 10,
    valueText: "-",
    valueFontSize: 60,
    valueTextColor: "#fff",
    labelText: "-",
    labelFontSize: 20,
  });

  var welcomeUser = document.getElementById("welcome_user");
  let homepage = document.getElementById("home_page");
  let passButton = document.getElementById("passButton");
  let passText = document.getElementById("passText");
  let passCard = document.getElementById("passCard");
  let pass_Page = document.getElementById("pass_Page");
  let passPageText = document.getElementById("passPageText");

  firebase.auth().onAuthStateChanged(function (user) {
    if (user) {
      let userMail = user.email;
      var uidDbRef = firebase.database().ref("uid/");
      let name = "";
      let risk = 0;

      uidDbRef.on("value", function (snapshot) {
        for (let key in snapshot.val()) {
          let mail = snapshot.val()[key].mail;

          if (mail == userMail) {
            var dbRef = firebase.database().ref("users/" + key);
            dbRef.on("value", function (snapshot) {
              loggedInUser = snapshot.val();
              loggedInUserNumber = key;

              name = loggedInUser.firstName;

              let passColor = loggedInUser.passColor;

              let risk = loggedInUser.riskScore;
              let riskMessage = loggedInUser.riskMessage;

              risk = 0.75;

              let riskValue = risk * 100;
              riskValue = riskValue.toFixed(2);

              let gaugeColor = "#27ae60";

              if (riskValue > 35 && riskValue < 70) gaugeColor = "#f39c12";
              else if (riskValue >= 70) gaugeColor = "#e74c3c";

              if (passColor == "yellow") gaugeColor = "#f39c12";
              else if (passColor == "green") gaugeColor = "#27ae60";
              else if (passColor == "red") gaugeColor = "#e74c3c";

              if (homepage != null) homepage.style.opacity = 1;

              if (passButton != null) {
                passButton.style.opacity = 1;
                passButton.style.background = gaugeColor;
              }

              if (pass_Page != null) pass_Page.style.background = gaugeColor;

              if (passText != null) passText.textContent = riskMessage;

              if (passCard != null) {
                passCard.style.background = gaugeColor;
                passCard.style.opacity = 1;
              }

              if (passPageText != null) passPageText.textContent = passColor.toUpperCase() + " PASS";

              if (welcomeUser != null) welcomeUser.innerHTML = "Welcome " + name + "!";

              selfScoreGauge.update({
                value: risk,
                valueText: riskValue,
                borderColor: gaugeColor,
                valueTextColor: gaugeColor,
                labelText: "Risk Score",
              });
            });
          }
        }
      });
    } else {
      if (notifAlert) {
        setTimeout(function () {
          app.router.navigate("/login/");
        }, 4000);
        notifAlert = false;
      } else {
        if (email == undefined && phone == undefined) app.router.navigate("/login/");
      }
    }
  });
});

function clickPass() {
  app.router.navigate("/pass/");
}

var notificationFull = app.notification.create({
  // icon: '<i class="icon demo-icon">7</i>',
  title: "Notification",
  titleRightText: "now",
  subtitle: "Download COVIDPass",
  text: "Your friend has listed you in the fight against Corona!",
  closeTimeout: 4000,
});

function openContacts() {
  app.router.navigate("/contacts/");
}

var counter = 1;
function contactClicked() {
  let referrals = document.getElementById("referralNew");

  let innerHtml = `
  <li>
    <div class="item-content">
      <div class="item-media"><i class="f7-icons if-not-md" style="color: black;">person</i></div>
      <div class="item-inner">
        <div class="item-title">+91 9765487652</div>
      </div>
    </div>
  </li>`;

  if (counter > 1) {
    innerHtml += `
  <li>
    <div class="item-content">
      <div class="item-media"><i class="f7-icons if-not-md" style="color: black;">person</i></div>
      <div class="item-inner">
        <div class="item-title">+91 9787699902</div>
      </div>
    </div>
  </li>`;
  }

  if (counter > 2) {
    innerHtml += `
  <li>
    <div class="item-content">
      <div class="item-media"><i class="f7-icons if-not-md" style="color: black;">person</i></div>
      <div class="item-inner">
        <div class="item-title">+91 8876588932</div>
      </div>
    </div>
  </li>`;
  }

  referrals.innerHTML = innerHtml;

  ++counter;
  app.router.back();
}

function booking() {
  app.dialog.alert("A Booking appointment has been confirmed!", function () {
    app.loginScreen.close();
  });
}
