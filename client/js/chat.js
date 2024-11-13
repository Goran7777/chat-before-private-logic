const { username } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});
const publicMessages = document.querySelector("#messages");
const socket = io("http://localhost:3000");

const autoscroll = () => {
  publicMessages.scrollBy(0, 500);
};
// scroll down every few seconds
setInterval(() => {
  autoscroll();
}, 5000);

// on load page
if (!username) {
  window.location.href = "./";
}

// on browser refresh

if (performance.navigation.type == 1) {
  alert("With page refresh you are loged out,click OK and log in again.");
  window.location.href = "./";
}

// front time
const frontTime = () => new Date().getTime();

// message sound managing
$(".sound").click(function () {
  const audio = document.getElementById("sound");
  const audio2 = document.getElementById("public_message");
  const audio3 = document.getElementById("mentioned");
  const audio4 = document.getElementById("new");
  audio.muted = !audio.muted;
  audio2.muted = !audio2.muted;
  audio3.muted = !audio3.muted;
  audio4.muted = !audio4.muted;
  if (!audio.muted && !audio2.muted && !audio3.muted && !audio4.muted) {
    $(".sound").removeClass("sound_off");
    $(".sound").addClass("sound_on");
  } else {
    $(".sound").removeClass("sound_on");
    $(".sound").addClass("sound_off");
  }
});

// on new user join public chat
socket.on("connect", () => {
  if (username || username !== undefined) {
    socket.emit("new user", username);
  }
});

// leave chat button
$(".leave").on("click", () => {
  location.href = "./";
});

socket.on("login error", (users, error) => {
  const html = `<div class='alert_container'>
  <p class='alert_error'>${error}</p>
  <button class='alert_button'>OK</button>
  </div>`;
  function appendAlert() {
    $("body").append(html);
  }

  if (error) {
    appendAlert();
    $(".alert_button").on("click", () => {
      location.href = "./";
    });
  }
  // make sure than array has unique values
  const newUsersArray = users.filter((x, y) => users.indexOf(x) == y).sort();

  newUsersArray.map((user) => incomeHtml(user));
});
socket.on("user left", ({ userLeft, time, users }) => {
  if (userLeft === "BAD-NICKNAME" || userLeft === undefined) {
    return;
  }
  const html = `<p class="public_message">${moment(time).format(
    "hh:mm"
  )} - Admin: User ${userLeft} left the chat!</p>`;

  $("#messages").append(html);

  autoscroll();
  // }
});
socket.on("socket_io_counter", function (users) {
  $(".sidebar_online_count").text(users.length);
});
const incomeHtml = (targeted_name) => {
  const html = `<li id="li${targeted_name}" 
               data-user="${targeted_name}
          "><span class="nick-name">${targeted_name}
           </span></li>`;
  $("#users").append(html);
};
// user joined message
socket.on("user joined", ({ username, time }, users) => {
  if (username === "BAD-NICKNAME" || username === undefined) {
    return;
  }

  incomeHtml(username);
  const html = `<p  class="public_message mentioned">${moment(time).format(
    "HH:mm"
  )} - Admin: User ${username} has join!</>`;
  $("#messages").append(html);
  $("#new").get(0).play();
  autoscroll();
});

socket.on("public msg from server", ({ message, name, time }) => {
  const str = `@${username}`;
  const check = message.includes(str);
  if (check) {
    $("#mentioned").get(0).play();
    let p = document.createElement("p");
    p.className = "mentioned";
    p.innerHTML = `${moment(time).format("HH:mm")} - ${name}: ${message}`;

    $("#messages").append(p);
    autoscroll();
    return;
  }

  const html = `<p class="public_message">${moment(time).format(
    "HH:mm"
  )} - ${name}: ${message}</p>`;
  $("#messages").append(html);
  $("#public_message").get(0).play();
  autoscroll();
});

// welcome message
setTimeout(() => {
  const message = `Welcome ${username},enjoy here!`;
  const html = `<p class="public_message mentioned">${message}</p>`;
  $("#messages").append(html);
  autoscroll();
}, 4000);

// refresh sidebar user list
socket.on("refresh sidebar", (users) => {
  $("#users").empty();
  users.sort().map((user) => refreshUsers(user));
});
// send public message
$("#message-form").on("submit", (e) => {
  e.preventDefault();
  const message = $("#public_input").val().trim();
  if (message.length > 1) {
    socket.emit("public message", { message, username }, (error) => {
      $("#public_input").focus();
      if (error) {
        return console.log(error);
      }
    });

    document.getElementById("public_input").value = "";
    // document.getElementById("public_message").play();
    $(".public_input").value = "";
    $(".public_input").focus();
    autoscroll();
    return;
  }
});

// send public message on button "Send" click
$(".send_public").on("click", () => {
  const message = $("#public_input").val().trim();
  if (message.length > 1) {
    socket.emit("public message", { message, username }, (error) => {
      $("#public_input").focus();
      if (error) {
        return console.log(error);
      }
    });
    document.getElementById("public_input").value = "";
    document.getElementById("public_message").play();
    $(".public_input").value = "";
    $(".public_input").focus();
    autoscroll();
    return;
  }
});

// internet validation
window.addEventListener("offline", () => {
  const error = "Internet connection lost.Check connection and log in again.";
  const html = `<div class='alert_container'>
  <p class='alert_error'>${error}</p>
  <button id="lost_internet" class='alert_button'>OK</button>
  </div>`;
  function appendAlert() {
    $("body").append(html);
  }
  appendAlert();
});

// redirection on internet loss
$(document).on("click", "#lost_internet", () => {
  window.location.href = "/";
});

function refreshUsers(user) {
  $("#users").append(
    '<li id="li' +
      user +
      '" data-user=' +
      user +
      '><span class="nick-name">' +
      user +
      "</span></li>"
  );
}

// add emoji in input for public message
$(`#emoji span`).click(function () {
  const val = $("#public_input").val();
  $("#public_input").val(val + $(this).text());
  $("#emoji").css("display", "none");
});

// login validation
$("#login_form").submit((e) => {
  e.preventDefault();
  const check = $("#rules").is(":checked");
  console.log("submited");
  window.location.href = "/";
});
