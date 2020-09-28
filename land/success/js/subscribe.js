(function () {
    'use strict';

    // PUSH NOTIFICATION
    var leadGuid, sessionGuid;

    // firebase_subscribe.js
    firebase.initializeApp({
        messagingSenderId: '42171590875'
    });

    // браузер поддерживает уведомления
    // вообще, эту проверку должна делать библиотека Firebase, но она этого не делает
    if ('Notification' in window) {
        var messaging = firebase.messaging();

        // пользователь уже разрешил получение уведомлений
        // подписываем на уведомления если ещё не подписали
        if (Notification.permission === 'granted') {
            subscribe();
        }

        // запрашиваем у пользователя разрешение на уведомления
        // и подписываем его
        document.addEventListener('DOMContentLoaded', subscribe);
    }

    function subscribe() {
        // запрашиваем разрешение на получение уведомлений
        messaging.requestPermission()
            .then(function () {
                // получаем ID устройства
                messaging.getToken()
                    .then(function (currentToken) {
                        if (currentToken) {
                            sendTokenToServer(currentToken);
                        } else {
                            console.warn('Не удалось получить токен.');
                            setTokenSentToServer(false);
                        }
                    })
                    .catch(function (err) {
                        console.warn('При получении токена произошла ошибка.', err);
                        setTokenSentToServer(false);
                    });
            })
            .catch(function (err) {
                console.warn('Не удалось получить разрешение на показ уведомлений.', err);
            });
    }

    // отправка ID на сервер
    function sendTokenToServer(currentToken) {
        if (!isTokenSentToServer(currentToken)) {
            console.log('Отправка токена на сервер...');
            var url = '/push.php'; // адрес скрипта на сервере который сохраняет ID устройства
            getGuids();

            var data = JSON.stringify({
                "push_token": currentToken,
                "session_guid": sessionGuid,
                "lead_guid": leadGuid,
            });

            sendPost(url, data);

            setTokenSentToServer(currentToken);
        } else {
            console.log('Токен уже отправлен на сервер.');
        }
    }

    // используем localStorage для отметки того,
    // что пользователь уже подписался на уведомления
    function isTokenSentToServer(currentToken) {
        return window.localStorage.getItem('sentFirebaseMessagingToken') == currentToken;
    }

    function setTokenSentToServer(currentToken) {
        window.localStorage.setItem(
            'sentFirebaseMessagingToken',
            currentToken ? currentToken : ''
        );
    }

    function sendPost(url, data) {
        fetch(url, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: data
        }).then(res => {
            console.log(res);
        });
    }

    function getGuids() {
        sessionGuid = window.location.search.match(/session_guid=([\w-]{36})/)[ 1 ];
        leadGuid = window.location.search.match(/lead_guid=([\w-]{36})/)[ 1 ];
    }

    // GEOLOCATION

    if (navigator.geolocation) {
        console.log('Geolocation work!');
        getGuids();
        document.addEventListener('DOMContentLoaded', getGeolocation);
    } else {
        console.log('Geolocation not available!');
    }

    function getGeolocation() {
        var url = 'geo.php';
        var data = {};
        var startPos;
        var subButton = document.querySelector('.ss-btn');

        console.log(data);
        console.log(leadGuid);
        if (subButton) {
            subButton.addEventListener('click', function () {
                sendPost(url, data);
            })
        } else {
            console.error('Not found button Subscribe!');
        }

        var geoOptions = {
            maximumAge: 5 * 60 * 1000,
            enableHighAccuracy: true,
        };

        var geoSuccess = function (position) {
            startPos = position;
            var latitude = startPos.coords.latitude;
            var longitude = startPos.coords.longitude;

            data = JSON.stringify({
                "lead_guid": leadGuid,
                "geolocation": {
                    "latitude": latitude,
                    "longitude": longitude
                }
            });
        };
        var geoError = function (error) {
            // console.log('Error occurred. Error code: ' + error.code);
            // error.code can be:
            //   0: unknown error
            //   1: permission denied
            //   2: position unavailable (error response from location provider)
            //   3: timed out

            data = JSON.stringify({
                "lead_guid": leadGuid,
                "geolocation": {
                    "error.code": error.code,
                    "error.message": error.message
                }
            });
        };
        navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
    }
})();
