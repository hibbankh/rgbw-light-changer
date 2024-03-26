import React, { useState } from "react"
import colorPrefix from './data/color.json'

export type Color = {
    red: number | string
    green: number | string
    blue: number | string
    white: number | string
}

export type Light = {
    id: number
    label: string
    switch: boolean
    value: boolean
    color: Color
}

interface LightComponentProps {
    light: Light
    onToggle: (id: number) => void
    onToggleSwitch: (id: number) => void
    onColorChange: (id: number, color: Color) => void
    onPreviewChange: (id: number, color: Color) => void
}

const LightComponent: React.FC<LightComponentProps> = ({ light, onToggle, onToggleSwitch, onColorChange, onPreviewChange }) => {
    const toggleLight = () => { onToggle(light.id) }
    const toggleLightSwitch = () => { onToggleSwitch(light.id) }

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>, colorKey: keyof Color) => {
        const { value } = e.target;
        const parsedValue = Number.isNaN(value) ? NaN : parseInt(value, 10);
        const clampedValue = Number.isNaN(parsedValue) ? "" : Math.min(Math.max(parsedValue, 0), 255); // Clamp value between 0 and 255
        const newColor = { ...light.color, [colorKey]: clampedValue }
        onColorChange(light.id, newColor)
    }

    const handleDefaultColorChange = (id: number, color: Color) => {
        onPreviewChange(id, color)
    }

    return (
        <div className="flex items-center justify-between">
            <div className="p-2 flex flex-col border m-4 rounded w-full">
                <div className="flex items-center space-x-2">
                    <div className="flex-grow">
                        <label htmlFor="one">
                            <input type="checkbox" name="one" id="one" checked={light.value} onChange={() => light.value} onClick={toggleLight} /> {light.label}
                        </label>
                    </div>
                    <div className="flex-end">
                        <label htmlFor="on-off">
                            <input type="checkbox" className="on-off" name="on-off" id="on-off" checked={light.switch} onChange={() => light.switch} onClick={toggleLightSwitch} />
                        </label>
                    </div>
                </div>
                <div className="flex flex-col w-full items-center">
                    < ColorPreview color={light.color} id={light.id} onPreviewChange={handleDefaultColorChange} />
                    <div className="flex flex-row items-center justify-center m-2 w-full">
                        <div className="flex flex-col flex-auto items-center">
                            <label htmlFor="red" className="capitalize">red</label>
                            <input type="number" className="w-14 h-8 rounded text-center" min={0} max={255} value={light.color.red} onChange={(e) => handleColorChange(e, "red")} />
                        </div>
                        <div className="flex flex-col flex-auto items-center">
                            <label htmlFor="green" className="capitalize ">green</label>
                            <input type="number" className="w-14 h-8 rounded text-center" min={0} max={255} value={light.color.green} onChange={(e) => handleColorChange(e, "green")} />
                        </div>
                        <div className="flex flex-col flex-auto items-center">
                            <label htmlFor="blue" className="capitalize ">blue</label>
                            <input type="number" className="w-14 h-8 rounded text-center" min={0} max={255} value={light.color.blue} onChange={(e) => handleColorChange(e, "blue")} />
                        </div>
                        <div className="flex flex-col flex-auto items-center">
                            <label htmlFor="white" className="capitalize ">white</label>
                            <input type="number" className="w-14 h-8 rounded text-center" min={0} max={255} value={light.color.white} onChange={(e) => handleColorChange(e, "white")} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface ColorPreviewProps {
    id: number
    color: Color
    onPreviewChange: (id: number, color: Color) => void
}

type RGBColor = Omit<Color, "white">

const ColorPreview: React.FC<ColorPreviewProps> = ({ id, color, onPreviewChange }) => {
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen)
    }

    const handleColorPreviewClick = () => {
        toggleDropdown()
    }

    const handleDropdownItemClick = (color: Number[]) => {
        onPreviewChange(id, {
            red: color[0] as number,
            green: color[1] as number,
            blue: color[2] as number,
            white: color[3] as number,
        })
    }

    const white = (((color.white as number / 255) * 100) * (1 / 100)).toFixed(2)
    const rgb: RGBColor = { red: color.red, green: color.green, blue: color.blue }
    let { red, green, blue } = color
    if (Object.values(rgb).every(value => value === 0)) {
        red = green = blue = 255
    }

    const dropdownColor = colorPrefix.color
    return (
        <div className="container py-2 flex items-center justify-center">
            <div className="relative">
                <div
                    className="w-24 h-8 rounded cursor-pointer"
                    style={{ backgroundColor: `rgba(${red}, ${green}, ${blue}, ${white})` }}
                    onClick={handleColorPreviewClick}
                ></div>
                {dropdownOpen && (
                    <div className="absolute top-full left-0 z-10 border-rounded mt-1 bg-white shadow-md rounded-md">
                        <div className="py-1">
                            {dropdownColor.map((def, index) => (
                                <button
                                    key={index}
                                    className={`w-24 h-8 block w-full text-left px-4 py-2 text-sm cursor-pointer font-semibold text-center ${def.text}`}
                                    style={{ backgroundColor: `rgba(${def.value.join(",")})` }}
                                    onClick={() => handleDropdownItemClick(def.value)}
                                >
                                    {def.name}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

interface LightsProps {
    lights: Light[]
    setLights: React.Dispatch<React.SetStateAction<Light[]>>
    switchLight: (id: number, switchState: boolean) => Promise<void>
}

const Lights: React.FC<LightsProps> = ({ lights, setLights, switchLight }) => {
    const toggleLight = (id: number) => {
        setLights(prevLights => prevLights.map(light => light.id === id ? { ...light, value: !light.value } : light))
    }

    const toggleLightSwitch = async (id: number) => {
        setLights(prevLights => prevLights.map(light => light.id === id ? { ...light, switch: !light.switch } : light))
        const light = lights.filter(light => light.id === id)
        if (light.length === 1) {
            const { switch: switchState } = light[0]
            await switchLight(id, switchState)
        }
    }

    const handleColorChange = (id: number, color: Color) => {
        setLights(prevLights => prevLights.map(light => (light.id === id ? { ...light, color } : light)))
    }

    const handlePreviewChange = (id: number, color: Color) => {
        setLights(prevLights => prevLights.map(light => (light.id === id ? { ...light, color } : light)))
        return color
    }
    return (
        <div>
            {lights.map((light) => (
                <LightComponent key={light.id} light={light} onToggle={toggleLight} onToggleSwitch={toggleLightSwitch} onColorChange={handleColorChange} onPreviewChange={handlePreviewChange} />
            ))}
        </div>
    );
}

export default Lights
