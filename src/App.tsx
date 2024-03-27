import mqtt, { MqttClient, IClientOptions } from 'mqtt';
import { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Color, Light } from './Light';
import Lights from './Light';
import dataColor from "./data/color.json"
import Loading from './Loading';

const defaultColor: Color = {
  red: 0,
  green: 0,
  blue: 0,
  white: 255
}

const mqtt_protocol = import.meta.env.VITE_MQTT_PROTOCOL
const mqtt_address = import.meta.env.VITE_MQTT_ADDR
const mqtt_port = import.meta.env.VITE_MQTT_PORT
const mqttHostUrl: string = `${mqtt_protocol}://${mqtt_address}:${mqtt_port}/mqtt`

const mqttOption: IClientOptions = {
  protocolId: "MQTT",
  protocolVersion: 5,
  clientId: "react_light_" + Math.random().toString(16).substring(2, 8)
}

type LightPayload = Omit<Light, "label" | "value" | "switch">

function App() {
  const [selectedColor, setSelectedColor] = useState<string | null>(null)
  const colors = dataColor
  const [activeTab, setActiveTab] = useState<string>("default")
  const [color,] = useState<Color>(defaultColor);
  const [brightness, setBrightness] = useState<number>(100)
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isDimming, setIsDimming] = useState<boolean>(false)
  const [client, setClient] = useState<MqttClient | null>(null);
  const [connectStatus, setConnectStatus] = useState<string>("Disconnected")

  const [lights, setLights] = useState<Light[]>([
    { id: 1, label: "Light 1", switch: true, value: true, color: defaultColor },
    { id: 2, label: "Light 2", switch: true, value: true, color: defaultColor },
    { id: 3, label: "Light 3", switch: true, value: true, color: defaultColor },
    { id: 4, label: "Light 4", switch: true, value: true, color: defaultColor },
  ]);

  // const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null)
  useEffect(() => {
    const id = setInterval(() => {
      if (brightness >= 100) {
        setIsDimming(() => true)
      } else if (brightness <= 0) {
        setIsDimming(() => false)
      }

      // Increasing brightness from 0 to 100 in 20 seconds
      if (isDimming) {
        setBrightness((brightness) => brightness - 5);
      } else {
        setBrightness((brightness) => brightness + 5);
      }
    }, 200); // Change brightness every 1 second
    return () => clearInterval(id);
  }, [brightness, isDimming]);

  const [loading, setLoading] = useState(false)
  const handleSelectDimColor = async (colorName: string) => {
    setSelectedColor(colorName);
    setIsFocused(true);


    if (connectStatus === "Disconnected") {
      setConnectStatus('Connecting');
      await mqttConnect(mqttHostUrl, mqttOption)
    }

    if (connectStatus === "Connected") {
      client?.publish("vl/dmx/wawasan/rx", colorName)
      toast.info(`${colorName} selected...`)
      setSelectedColor(colorName)
    }

    setLoading(() => true)
    setTimeout(() => {
      setLoading(() => false)
    }, 40 * 1000);

  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  const handleSaveButtonClick = async () => {
    // Check if any field is empty
    if (Object.values(color).some(value => (value === "" || Number.isNaN(value)))) {
      console.error(color)
      toast.error("Please fill in all fields.");
      return;
    }
    if (connectStatus === "Disconnected") {
      setConnectStatus('Connecting');
      await mqttConnect(mqttHostUrl, mqttOption)
    }

    if (connectStatus === "Connected") {
      const payload: LightPayload[] = lights.
        filter(({ value }) => value). //filter enabled light
        map(({ id, color }) => ({ id, color })) // extract only id and color property

      client?.publish("lampu", JSON.stringify(payload))
      toast.info("Sending...")
    }
  };

  const handleSwitchOff = async (id: number, switchState: boolean) => {
    if (connectStatus === "Disconnected") {
      setConnectStatus('Connecting');
      await mqttConnect(mqttHostUrl, mqttOption)
    }
    if (switchState === true) {
      client?.publish("off", JSON.stringify(id))
      toast.info("Switching light off...")
    } else {
      client?.publish("on", JSON.stringify(id))
      toast.info("Switching light on...")
    }
    return
  }



  const mqttConnect = async (host: string, mqttOption: IClientOptions) => {
    // const newClient = await mqtt.connect(host, mqttOption)
    if (!client) {
      const newClient = await mqtt.connectAsync(host, mqttOption)

      newClient.on("error", (error: Error) => {
        setConnectStatus("Disconnected")
        toast.error(error.message)
      })

      newClient.on("offline", () => {
        if (connectStatus === "Disconnected") {
          toast.warning("MQTT Connection Offline")
        }
        setConnectStatus("Disconnected")
      })

      newClient.on("connect", () => {
        if (connectStatus !== "Connected") {
          toast.success("Connected")
        }
        setClient(newClient)
        setConnectStatus("Connected")
      })
    }
  };

  useEffect(() => {
    const initializeConnection = async () => {
      if (!client || connectStatus !== "Connected") {
        setConnectStatus('Connecting');
        await mqttConnect(mqttHostUrl, mqttOption); // Call mqttConnect only if client is not already set
      }
    };

    initializeConnection();

    // Cleanup function
    return () => {
      if (client) {
        client.end(); // Close the MQTT connection when the component unmounts
      }
    };
  }, [client]); // Dependency array ensures this effect runs when the 'client' state changes

  const handleChangeTab = (tab: string) => {
    setActiveTab(tab)
  }


  const handleSelectSolidColor = async (name: string) => {

    if (connectStatus === "Disconnected") {
      setConnectStatus('Connecting');
      await mqttConnect(mqttHostUrl, mqttOption)
    }

    if (connectStatus === "Connected") {
      client?.publish("vl/dmx/wawasan/rx", name)
      toast.info(`${name} selected...`)
      setSelectedColor(name)
    }

  }

  return (
    <>{loading && <Loading loading={loading} />}
      <div className="flex items-center justify-center min-h-screen md:mt-4">
        <div className="container max-w-md my-4 flex flex-col">
          <div className="flex w-full justify-between mx-auto top">
            <button className={`px-4 py-2 rounded-t-lg ${activeTab === "default" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-800"}`} onClick={() => handleChangeTab("default")}>
              Default
            </button>
            <button className={`px-4 py-2 rounded-t-lg ${activeTab === "preset" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-800"}`} onClick={() => handleChangeTab("preset")}>
              Preset
            </button>
            <button className={`px-4 py-2 rounded-t-lg ${activeTab === "dim" ? "bg-blue-800 text-white" : "bg-gray-200 text-gray-800"}`} onClick={() => handleChangeTab("dim")}>
              Dim
            </button>
          </div>
          {activeTab === "default" &&
            <>
              <Lights lights={lights} setLights={setLights} switchLight={handleSwitchOff} />
              <div className="flex flex-col flex-grow">
                <div className="flex justify-center">
                  <div>
                    <button
                      className="bg-blue-800 hover:bg-blue-700 text-slate-200 py-2 px-6 rounded"
                      onClick={handleSaveButtonClick}>Save</button>
                    <ToastContainer autoClose={1000} />
                  </div>
                </div>
              </div>
            </>
          }
          {activeTab === "preset" &&
            <>
              <div className="container py-2 flex items-center justify-between">
                <div className="relative grid grid-cols-4 gap-4">
                  {colors.solid.map((color, index) => {
                    return (
                      <div
                        key={index}
                        className={`${isFocused && selectedColor === color.name ? 'ring-2 ring-blue-400' : ''} w-16 h-16 rounded cursor-pointer text-center content-center ${color.text}`}
                        style={{ backgroundColor: `rgba(${color.value.join(",")})` }}
                        onClick={() => handleSelectSolidColor(color.name)}
                      >{color.name}</div>
                    )
                  })}
                </div>
                <ToastContainer autoClose={1000} />
              </div>
            </>
          }
          {activeTab === "dim" && <>
            <div className="container py-2 flex items-center justify-between">
              <div className="relative grid grid-cols-4 gap-4">
                {colors.dim.map((color, index) => {
                  return (
                    <div
                      key={index}
                      className={`${isFocused && selectedColor === color.name ? 'ring-2 ring-blue-400' : ''} w-16 h-16 rounded cursor-pointer text-center content-center border ${color.text}`}
                      style={{ backgroundColor: `rgba(${color.value.join(",")}, ${brightness / 100})` }}
                      onClick={() => handleSelectDimColor(color.name)}
                      onBlur={handleBlur}
                      tabIndex={0}
                    ></div>
                  )
                })}
              </div>
            </div>
          </>}
        </div>
      </div>
    </>
  );
}

export default App;
