import React, { useState } from "react"
import { Badge } from "../ui/badge"
import { MapPin } from "lucide-react"

interface ARObjectProps {
  type: "item" | "creature" | "deal"
  data: any
  style: React.CSSProperties
  onCatch?: () => void
}

export const ARObject: React.FC<ARObjectProps> = ({ type, data, style, onCatch }) => {
  const [captured, setCaptured] = useState(false)

  const handleCapture = () => {
    setCaptured(true)
    setTimeout(() => {
      if (onCatch) onCatch()
    }, 400) // match animation duration
  }

  return (
    <div
      className={`absolute pointer-events-auto cursor-pointer transition-all duration-300 ar-object ${captured ? "scale-50 opacity-0 animate-bounce-out" : "hover:scale-110"}`}
      style={style}
      onClick={captured ? undefined : handleCapture}
    >
      {type === "item" && (
        <div className="relative animate-float-3d">
          <div className="glass-3d text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-green-400/30 animate-pulse">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {data.item}
              {data.discount && (
                <Badge className="bg-red-500/80 text-white text-xs ml-1">-{data.discount}%</Badge>
              )}
            </div>
            <div className="text-xs text-green-300 mt-1">${data.price}</div>
          </div>
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">↓</div>
        </div>
      )}
      {type === "creature" && (
        <div className="relative animate-float-3d">
          <div className="glass-3d text-black p-3 rounded-full shadow-lg border border-yellow-400/50 animate-bounce">
            <div className="text-2xl">{data.emoji}</div>
          </div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center glass-3d rounded-full px-2 py-1 border border-white/20 whitespace-nowrap">
            <div className="text-white font-bold">{data.name}</div>
            <div className="text-yellow-400 text-xs">⚡ {data.power}</div>
          </div>
        </div>
      )}
      {type === "deal" && (
        <div className="relative animate-float-3d">
          <div className="glass-3d bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white p-3 rounded-xl shadow-lg border border-red-400/50 animate-pulse">
            <div className="text-xs font-bold">{data.name}</div>
            <div className="text-lg font-bold">-{data.discount}%</div>
            <div className="text-xs">{data.category}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ARObject 