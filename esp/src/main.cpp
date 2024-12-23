#define BLYNK_TEMPLATE_ID "TMPL6Ay4jEwKd"
#define BLYNK_TEMPLATE_NAME "Farm Controller"
#define BLYNK_AUTH_TOKEN "IwPeNLS-om6meQvYYsPpgPCb_gGi1osg"

#include <Adafruit_Sensor.h>
#include <Arduino.h>
#include <DHT.h>
#include <WiFi.h>
#include <WiFiClient.h>
#include <BlynkSimpleEsp32.h>
#include <SocketIoClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <ArduinoJson.h>
#include <DHT_U.h>

#define BLYNK_PRINT Serial
#define LED_PIN 21
#define BTN_AUTO_MODE 22
#define BTN_LED 23

const int DHT_PIN = 19;

SocketIoClient socket;

const char auth[] = BLYNK_AUTH_TOKEN;
const char ssid[] = "Wokwi-GUEST";
const char pass[] = "";
const char *host = "192.168.1.2"; // Địa chỉ IP hoặc tên miền của server
const int port = 3000;

DHT_Unified dht(DHT_PIN, DHT22);

int autoMode = 0;
float temperature = 0;
float humidity = 0;
int light = 0;
int pump = 0;

void handleData()
{
  sensors_event_t event;

  // Lấy nhiệt độ từ cảm biến DHT
  dht.temperature().getEvent(&event);
  float currentTemperature = event.temperature;

  // Lấy độ ẩm từ cảm biến DHT
  dht.humidity().getEvent(&event);
  float currentHumidity = event.relative_humidity;

  if (
      currentTemperature != temperature ||
      currentHumidity != humidity)
  {
    Serial.println(currentTemperature);
    Serial.println(currentHumidity);

    temperature = currentTemperature;
    humidity = currentHumidity;

    Blynk.virtualWrite(V1, temperature);
    Blynk.virtualWrite(V2, humidity);

    DynamicJsonDocument doc(200);
    doc["temperature"] = temperature;
    doc["humidity"] = humidity;

    String jsonStr;
    serializeJson(doc, jsonStr);

    socket.emit("data", jsonStr.c_str());
  }
}

void handleAutoMode()
{
  if (autoMode)
  {
    if (temperature < 20 && light == 0)
    {
      digitalWrite(LED_PIN, HIGH);
      light = 1;
      Blynk.virtualWrite(V3, light);
    }
    else if (temperature >= 20 && light == 1)
    {
      digitalWrite(LED_PIN, LOW);
      light = 0;
      Blynk.virtualWrite(V3, light);
    }

    if (humidity < 40)
    {
      pump = 1;
      Blynk.virtualWrite(V4, pump);
    }
    else
    {
      pump = 0;
      Blynk.virtualWrite(V4, pump);
    }
  }
}

void handleButton()
{
  if (digitalRead(BTN_LED) == LOW)
  {
    digitalWrite(LED_PIN, !digitalRead(LED_PIN));
    while (
        digitalRead(BTN_LED) == LOW)
    {
      delay(100);
    }
  }

  if (digitalRead(BTN_AUTO_MODE) == LOW)
  {
    autoMode = !autoMode;
    Blynk.virtualWrite(V0, autoMode);
    while (
        digitalRead(BTN_AUTO_MODE) == LOW)
    {
      delay(100);
    }
  }
}

void setup()
{
  Serial.begin(9600);
  dht.begin();
  WiFi.begin(ssid, pass);
  Blynk.begin(BLYNK_AUTH_TOKEN, ssid, pass);
  socket.begin(host, port);
  pinMode(LED_PIN, OUTPUT);
  pinMode(BTN_AUTO_MODE, INPUT_PULLUP);
  pinMode(BTN_LED, INPUT_PULLUP);
}

void loop()
{
  Blynk.run();
  socket.loop();
  handleData();
  handleAutoMode();
  handleButton();
}

BLYNK_WRITE(V0)
{
  autoMode = param.asInt();
}

BLYNK_WRITE(V3)
{
  if (autoMode)
  {
    Blynk.virtualWrite(V3, light);
  }
  else
  {
    light = param.asInt();
    digitalWrite(LED_PIN, light);
  }
}

BLYNK_WRITE(V4)
{
  if (autoMode)
  {
    Blynk.virtualWrite(V4, pump);
  }
  else
    pump = param.asInt();
}