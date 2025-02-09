// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ freeboard-actuator-plugin                                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ http://blog.onlinux.fr/actuator-plugin-for-freeboard-io/           │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Freeboard widget plugin.                                           │ \\
// └────────────────────────────────────────────────────────────────────┘ \\
/*
Iniciar el servidor node en:
    /Documentos/Programacion/Javascript/Nodejs/mi-servidor-web$ sudo node index.js
Abrir freeboard en el navegador en la direccion:
    http://localhost:3000/freeboard-master/index.html

ACTUAL FASE DEL PROYECTO
 --Revisar la propiedad retained de MQTT para recordadr el estado del actuador(ultimo mensaje)Hecho

*/
(function () {
    //
    // DECLARATIONS
    //
    var LOADING_INDICATOR_DELAY = 1000;

    //

    freeboard.loadWidgetPlugin({
        type_name: "actuatorMQTTNotSensData",
        display_name: "actuatorMQTTNotSensData",
        description: "Actuator which can send a value as well as receive one",
				//external_scripts: "https://cdnjs.cloudflare.com/ajax/libs/paho-mqtt/1.0.1/mqttws31.js",
        settings: [
            {
                name: "title",
                display_name: "Title",
                type: "text"
            },
            {
                name: "value",
                display_name: "Value",
                type: "calculated"
            },
            {
                name: "urlOn",
                display_name: "url On ",
                type: "calculated"
            },
            {
                name: "urlOff",
                display_name: "url Off ",
                type: "calculated"
            },
            {
                name: "on_text",
                display_name: "On Text",
                type: "calculated"
            },
            {
                name: "off_text",
                display_name: "Off Text",
                type: "calculated"
            },
						  {
				        name: "json_data",
				        display_name: "JSON messages?",
				        type: "boolean",
				        description: "If the messages on your topic are in JSON format they will be parsed so the individual fields can be used in freeboard widgets",
				        default_value: true
				      }

        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new actuator(settings));//FIXME: 129 problema de conexion newInstance firefox
        }
    });

    freeboard.addStyle('.indicator-light.interactive:hover', "box-shadow: 0px 0px 15px #FF9900; cursor: pointer;");
    var actuator = function (settings) {
        var self = this;
        var titleElement = $('<h2 class="section-title"></h2>');
        var stateElement = $('<div class="indicator-text"></div>');
        var indicatorElement = $('<div class="indicator-light interactive"></div>');
        var currentSettings = settings;
        var isOn = false;
        var onText;
        var offText;
        var url;




function enviar(estado) {
		// Fetch the MQTT topic from the form
		topic = currentSettings.topic;
    if (estado) {
				mensaje = '{"luz":1}';
		}else {
        mensaje = '{"luz":0}';
    }
		//mensaje = "Hola desde MqttFreboard ON";



    freeboard.showLoadingIndicator(true);
    let myHeaders = new Headers();

    const options = {
      method: 'POST',
      headers: myHeaders,
      body: new URLSearchParams({
        'switchState': mensaje
      }),
    }
    const host = '/dash/actuatorMQTT';
    let myRequest = new Request(host, options);
    fetch(myRequest, {credentials: 'include'})
      .then((res) => {
        if(res.ok) {
          console.log('Ok');
          return res.json(); // <- parseamos el response y lo devolvemos a nuestra función
        }

      })
      .then((resParsed) => {
        if(resParsed  !== null){//Si hay datos del dashboard en el JSON recibido mediante POST
        //  var jsonObject = JSON.parse(resParsed);
          console.log("recibido por el servidor: ",resParsed); // <- mostramos los datos recibidos
          freeboard.showLoadingIndicator(false);
      }else{
          //alert("Now you dont have a saved Dasboard on cloud!");    //
          freeboard.showLoadingIndicator(false);
          console.log("Ocurrio un error en el servidor al publicar en Broker MQTT");
          //freeboard.showDialog($("<div align='center'>Now you dont have a saved Dasboard on cloud!</div>"),"No prblem!","OK",null,function(){});
      }
      })
      .catch((error) => {
        console.log(error);
      });


}







        function updateState() {
            indicatorElement.toggleClass("on", isOn);

            if (isOn) {
                stateElement.text((_.isUndefined(onText) ? (_.isUndefined(currentSettings.on_text) ? "" : currentSettings.on_text) : onText));
								//publicar(isOn);
						}
            else {
                stateElement.text((_.isUndefined(offText) ? (_.isUndefined(currentSettings.off_text) ? "" : currentSettings.off_text) : offText));


            }
        }


        this.onClick = function(e) {
            e.preventDefault()

            var new_val = !isOn
            enviar(new_val);//FIXME: 250 causa problema de coneccion PUBLICAR Firefox
            this.onCalculatedValueChanged('value', new_val);
            url = (new_val) ? currentSettings.urlOn : currentSettings.urlOff;//urloff proviene del campo off url
          //  if (_.isUndefined(url))
                //freeboard.showDialog($("<div align='center'>url undefined</div>"), "Error!", "OK", null, function () {
          //      }
          //    );
          //  else {
                this.sendValue(url, new_val);
          //  }
        }


        this.render = function (element) {
            $(element).append(titleElement).append(indicatorElement).append(stateElement);
            $(indicatorElement).click(this.onClick.bind(this));//FIXME: 265 problema de conexion  this.onClick firefox
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(newSettings.title) ? "" : newSettings.title));
            updateState();
        }

        this.onCalculatedValueChanged = function (settingName, newValue) {
            if (settingName == "value") {
                isOn = Boolean(newValue);
            }
            if (settingName == "on_text") {
                onText = newValue;
            }
            if (settingName == "off_text") {
                offText = newValue;
            }
            updateState();
        }

        var request;

        this.sendValue = function (url, options) {
            //console.log(url, options);
            console.log('Button state: ', options);
            request = new XMLHttpRequest();
            if (!request) {
                console.log('Giving up :( Cannot create an XMLHTTP instance');
                return false;
            }
            request.onreadystatechange = this.alertContents;
            request.open('GET', url, true);
            //freeboard.showLoadingIndicator(true);
            //request.send();
        }

        this.alertContents = function () {
            if (request.readyState === XMLHttpRequest.DONE) {
                if (request.status === 200) {
                    console.log(request.responseText);
                    setTimeout(function () {
                        freeboard.showLoadingIndicator(false);
                        //freeboard.showDialog($("<div align='center'>Request response 200</div>"),"Success!","OK",null,function(){});
                    }, LOADING_INDICATOR_DELAY);
                } else {
                    //console.log('There was a problem with the request.');
                    //console.log("Estatus" + request.status);
                    setTimeout(function () {
                        freeboard.showLoadingIndicator(false);
                    //    freeboard.showDialog($("<div align='center'>There was a problem with the request. Code " + request.status + request.responseText + " </div>"), "Error!", "OK", null, function () {   });
                    }, LOADING_INDICATOR_DELAY);
                }

            }

        }

        this.onDispose = function () {
        }

        this.getHeight = function () {
            return 1;
        }

        this.onSettingsChanged(settings);
    };

}());
