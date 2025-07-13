"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  Camera,
  Map,
  Trophy,
  Gift,
  User,
  ShoppingCart,
  Zap,
  Star,
  Target,
  Clock,
  CheckCircle,
  MapPin,
  Scan,
  RotateCcw,
  Volume2,
  VolumeX,
  Smartphone,
  Compass,
  CreditCard,
  Download,
  Filter,
  Plus,
  Minus,
  X,
  Check,
  Flame,
  Crown,
  Gem,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
// Change the import to avoid conflict
import CameraComponent from "@/components/ui/Camera"
import ARObject from "../components/ar/ARObject"

interface ARObject {
  id: string
  type: "item" | "creature" | "waypoint" | "deal" | "review"
  x: number
  y: number
  z: number
  scale: number
  rotation: number
  data: any
  velocity?: { x: number; y: number; z: number }
  lastUpdate: number
  stable: boolean
}

interface DeviceMotionData {
  acceleration: { x: number; y: number; z: number }
  rotationRate: { alpha: number; beta: number; gamma: number }
  orientation: { alpha: number; beta: number; gamma: number }
  timestamp: number
}

interface CartItem {
  id: number
  name: string
  price: number
  quantity: number
  image: string
  rating: number
  discount?: number
}

interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  progress: number
  maxProgress: number
  reward: number
}

export default function ShopQuestAR() {
  const [activeTab, setActiveTab] = useState("list")
  const [xp, setXp] = useState(1250)
  const [level, setLevel] = useState(8)
  const [coins, setCoins] = useState(450)
  const [streak, setStreak] = useState(7)
  const [isScanning, setIsScanning] = useState(false)
  const [foundItems, setFoundItems] = useState(2)
  const [totalItems, setTotalItems] = useState(5)
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [isARActive, setIsARActive] = useState(false)
  const [isCameraReady, setIsCameraReady] = useState(false)
  const [arObjects, setArObjects] = useState<ARObject[]>([])
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [isCalibrating, setIsCalibrating] = useState(false)
  const [sensorsEnabled, setSensorsEnabled] = useState(false)
  const [motionPermission, setMotionPermission] = useState<"granted" | "denied" | "prompt">("prompt")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [showAchievements, setShowAchievements] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [priceRange, setPriceRange] = useState([0, 100])
  const [isARFullscreen, setIsARFullscreen] = useState(false)
  const [demoMode, setDemoMode] = useState(false)

  // Enhanced sensor data with stability threshold
  const [deviceMotion, setDeviceMotion] = useState<DeviceMotionData>({
    acceleration: { x: 0, y: 0, z: 0 },
    rotationRate: { alpha: 0, beta: 0, gamma: 0 },
    orientation: { alpha: 0, beta: 0, gamma: 0 },
    timestamp: 0,
  })

  // Motion detection with stability
  const [motionHistory, setMotionHistory] = useState<DeviceMotionData[]>([])
  const [isMoving, setIsMoving] = useState(false)
  const [motionIntensity, setMotionIntensity] = useState(0)
  const [lastSignificantMotion, setLastSignificantMotion] = useState(0)

  // Stability thresholds
  const MOTION_THRESHOLD = 0.15 // Minimum motion to trigger updates
  const STABILITY_TIME = 500 // ms to wait before considering stable
  const ORIENTATION_THRESHOLD = 2 // degrees

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const arContainerRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const lastMotionRef = useRef<DeviceMotionData | null>(null)
  const installPromptRef = useRef<any>(null)

  // Ecommerce data
  const [cart, setCart] = useState<CartItem[]>([
    {
      id: 1,
      name: "Organic Milk 2%",
      price: 4.99,
      quantity: 1,
      image: "🥛",
      rating: 4.8,
      discount: 10,
    },
  ])

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first_scan",
      title: "First Scanner",
      description: "Complete your first AR scan",
      icon: "🎯",
      unlocked: true,
      progress: 1,
      maxProgress: 1,
      reward: 50,
    },
    {
      id: "motion_master",
      title: "Motion Master",
      description: "Use motion controls 50 times",
      icon: "🏃",
      unlocked: false,
      progress: 23,
      maxProgress: 50,
      reward: 200,
    },
    {
      id: "deal_hunter",
      title: "Deal Hunter",
      description: "Find 10 special deals",
      icon: "💎",
      unlocked: false,
      progress: 3,
      maxProgress: 10,
      reward: 500,
    },
    {
      id: "streak_master",
      title: "Streak Master",
      description: "Maintain 30-day shopping streak",
      icon: "🔥",
      unlocked: false,
      progress: 7,
      maxProgress: 30,
      reward: 1000,
    },
  ])

  const [activeQuests, setActiveQuests] = useState([
    {
      id: 1,
      title: "Dairy Dash",
      description: "Find 3 dairy items in 5 mins",
      progress: 2,
      total: 3,
      reward: 150,
      timeLeft: "3:24",
      active: true,
      type: "speed",
    },
    {
      id: 2,
      title: "Snack Attack",
      description: "Collect 5 snack creatures",
      progress: 3,
      total: 5,
      reward: 200,
      timeLeft: "12:45",
      active: false,
      type: "collection",
    },
    {
      id: 3,
      title: "Deal Seeker",
      description: "Find 3 items with 20%+ discount",
      progress: 1,
      total: 3,
      reward: 300,
      timeLeft: "8:15",
      active: false,
      type: "savings",
    },
  ])

  const [shoppingList, setShoppingList] = useState([
    {
      id: 1,
      item: "Milk (2%)",
      found: true,
      aisle: "A12",
      creature: "Moobert",
      distance: 0,
      price: 4.99,
      discount: 10,
      rating: 4.8,
      reviews: 234,
    },
    {
      id: 2,
      item: "Bread (Whole Wheat)",
      found: true,
      aisle: "B8",
      creature: null,
      distance: 0,
      price: 3.49,
      rating: 4.5,
      reviews: 156,
    },
    {
      id: 3,
      item: "Eggs (Dozen)",
      found: false,
      aisle: "A12",
      creature: "Eggbert",
      distance: 15,
      price: 5.99,
      discount: 15,
      rating: 4.9,
      reviews: 445,
    },
    {
      id: 4,
      item: "Bananas",
      found: false,
      aisle: "C3",
      creature: "Bananoid",
      distance: 32,
      price: 2.99,
      rating: 4.6,
      reviews: 89,
    },
    {
      id: 5,
      item: "Chicken Breast",
      found: false,
      aisle: "D15",
      creature: "Clucky",
      distance: 45,
      price: 12.99,
      discount: 20,
      rating: 4.7,
      reviews: 312,
    },
  ])

  const [creatures, setCreatures] = useState([
    { id: 1, name: "Moobert", category: "Dairy", rarity: "Common", caught: true, emoji: "🥛", power: 150 },
    { id: 2, name: "Cheezoid", category: "Dairy", rarity: "Rare", caught: false, emoji: "🧀", power: 300 },
    { id: 3, name: "Bananoid", category: "Produce", rarity: "Common", caught: false, emoji: "🍌", power: 120 },
    { id: 4, name: "Eggbert", category: "Dairy", rarity: "Uncommon", caught: false, emoji: "🥚", power: 200 },
    { id: 5, name: "Clucky", category: "Meat", rarity: "Rare", caught: false, emoji: "🐔", power: 350 },
    { id: 6, name: "Breadster", category: "Bakery", rarity: "Common", caught: false, emoji: "🍞", power: 100 },
  ])

  // PWA Installation
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      installPromptRef.current = e
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)
  }, [])

  const installPWA = async () => {
    if (installPromptRef.current) {
      installPromptRef.current.prompt()
      const { outcome } = await installPromptRef.current.userChoice
      if (outcome === "accepted") {
        console.log("PWA installed")
      }
      installPromptRef.current = null
    }
  }

  // Fullscreen handling
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
        setIsFullscreen(true)
      } else {
        await document.exitFullscreen()
        setIsFullscreen(false)
      }
    } catch (error) {
      console.error("Fullscreen error:", error)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  // Request device motion permissions (iOS 13+)
  const requestMotionPermission = useCallback(async () => {
    if (typeof (DeviceMotionEvent as any).requestPermission === "function") {
      try {
        const permission = await (DeviceMotionEvent as any).requestPermission()
        setMotionPermission(permission)
        if (permission === "granted") {
          setSensorsEnabled(true)
        }
      } catch (error) {
        console.error("Motion permission error:", error)
        setMotionPermission("denied")
      }
    } else {
      setSensorsEnabled(true)
      setMotionPermission("granted")
    }
  }, [])

  // Enhanced camera initialization with glass effect integration
  const initializeCamera = useCallback(async () => {
    try {
      setIsCameraReady(false)
      setCameraError(null)

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Camera not supported on this device")
      }

      const constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1920, min: 640 },
          height: { ideal: 1080, min: 480 },
          frameRate: { ideal: 30, min: 15 },
        },
        audio: false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      setCameraStream(stream)

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        videoRef.current.onloadedmetadata = () => {
          setIsCameraReady(true)
          setIsARActive(true)
        }

        videoRef.current.oncanplay = () => {
          const playPromise = videoRef.current?.play()
          if (playPromise) {
            playPromise.catch((error) => {
              console.warn("Video play failed:", error)
            })
          }
        }

        videoRef.current.onerror = (error) => {
          console.error("Video error:", error)
          setCameraError("Video playback error")
        }
      }
    } catch (error: any) {
      console.error("Camera initialization error:", error)
      let errorMessage = "Camera access failed"

      if (error.name === "NotAllowedError") {
        errorMessage = "Camera permission denied. Please allow camera access and refresh."
      } else if (error.name === "NotFoundError") {
        errorMessage = "No camera found on this device"
      } else if (error.name === "NotReadableError") {
        errorMessage = "Camera is being used by another application"
      } else if (error.message) {
        errorMessage = error.message
      }

      setCameraError(errorMessage)
      setIsARActive(false)
      setIsCameraReady(false)
    }
  }, [])

  // Stop camera with proper cleanup
  const stopCamera = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.srcObject = null
      videoRef.current.onloadedmetadata = null
      videoRef.current.oncanplay = null
      videoRef.current.onerror = null
    }

    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop()
      })
      setCameraStream(null)
    }

    setIsARActive(false)
    setIsCameraReady(false)
  }, [cameraStream])

  // Enhanced device motion handling with stability
  useEffect(() => {
    if (!sensorsEnabled) return

    const handleDeviceMotion = (event: DeviceMotionEvent) => {
      const now = Date.now()
      const motionData: DeviceMotionData = {
        acceleration: {
          x: event.acceleration?.x || 0,
          y: event.acceleration?.y || 0,
          z: event.acceleration?.z || 0,
        },
        rotationRate: {
          alpha: event.rotationRate?.alpha || 0,
          beta: event.rotationRate?.beta || 0,
          gamma: event.rotationRate?.gamma || 0,
        },
        orientation: deviceMotion.orientation,
        timestamp: now,
      }

      // Check for significant motion
      const lastMotion = lastMotionRef.current
      if (lastMotion) {
        const accelDiff = Math.sqrt(
          Math.pow(motionData.acceleration.x - lastMotion.acceleration.x, 2) +
            Math.pow(motionData.acceleration.y - lastMotion.acceleration.y, 2) +
            Math.pow(motionData.acceleration.z - lastMotion.acceleration.z, 2),
        )

        const rotationDiff = Math.sqrt(
          Math.pow(motionData.rotationRate.alpha - lastMotion.rotationRate.alpha, 2) +
            Math.pow(motionData.rotationRate.beta - lastMotion.rotationRate.beta, 2) +
            Math.pow(motionData.rotationRate.gamma - lastMotion.rotationRate.gamma, 2),
        )

        if (accelDiff > MOTION_THRESHOLD || rotationDiff > MOTION_THRESHOLD) {
          setLastSignificantMotion(now)
        }
      }

      setDeviceMotion(motionData)

      setMotionHistory((prev) => {
        const newHistory = [...prev, motionData].slice(-10)

        if (newHistory.length > 1) {
          const recent = newHistory.slice(-3)
          const avgAcceleration =
            recent.reduce((sum, data) => {
              return sum + Math.sqrt(data.acceleration.x ** 2 + data.acceleration.y ** 2 + data.acceleration.z ** 2)
            }, 0) / recent.length

          const intensity = Math.min(avgAcceleration / 10, 1)
          setMotionIntensity(intensity)
          setIsMoving(intensity > MOTION_THRESHOLD)
        }

        return newHistory
      })

      lastMotionRef.current = motionData
    }

    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const now = Date.now()
      const newOrientation = {
        alpha: event.alpha || 0,
        beta: event.beta || 0,
        gamma: event.gamma || 0,
      }

      // Check for significant orientation change
      const lastOrientation = deviceMotion.orientation
      const orientationDiff = Math.sqrt(
        Math.pow(newOrientation.alpha - lastOrientation.alpha, 2) +
          Math.pow(newOrientation.beta - lastOrientation.beta, 2) +
          Math.pow(newOrientation.gamma - lastOrientation.gamma, 2),
      )

      if (orientationDiff > ORIENTATION_THRESHOLD) {
        setLastSignificantMotion(now)
      }

      setDeviceMotion((prev) => ({
        ...prev,
        orientation: newOrientation,
      }))
    }

    window.addEventListener("devicemotion", handleDeviceMotion)
    window.addEventListener("deviceorientation", handleDeviceOrientation)

    return () => {
      window.removeEventListener("devicemotion", handleDeviceMotion)
      window.removeEventListener("deviceorientation", handleDeviceOrientation)
    }
  }, [sensorsEnabled, deviceMotion.orientation])

  // Initialize AR objects with ecommerce data
  useEffect(() => {
    const initializeARObjects = () => {
      const objects: ARObject[] = []
      const now = Date.now()

      // Add item waypoints with ecommerce data
      shoppingList.forEach((item, index) => {
        if (!item.found) {
          objects.push({
            id: `item-${item.id}`,
            type: "item",
            x: Math.sin(index * 1.2) * 300 + 200,
            y: Math.cos(index * 1.2) * 200 + 150,
            z: item.distance * 3,
            scale: Math.max(0.3, 1 - item.distance / 150),
            rotation: index * 45,
            data: item,
            velocity: { x: 0, y: 0, z: 0 },
            lastUpdate: now,
            stable: true,
          })
        }
      })

      // Add creatures with enhanced data
      creatures.forEach((creature, index) => {
        if (!creature.caught) {
          objects.push({
            id: `creature-${creature.id}`,
            type: "creature",
            x: Math.sin(index * 0.8) * 250 + Math.random() * 150,
            y: Math.cos(index * 0.8) * 180 + Math.random() * 120 + 200,
            z: Math.random() * 80 + 30,
            scale: 0.6 + Math.random() * 0.6,
            rotation: Math.random() * 360,
            data: creature,
            velocity: {
              x: (Math.random() - 0.5) * 2,
              y: (Math.random() - 0.5) * 1,
              z: (Math.random() - 0.5) * 0.5,
            },
            lastUpdate: now,
            stable: false,
          })
        }
      })

      // Add special deals
      const deals = [
        { id: "deal1", name: "Flash Sale", discount: 50, category: "Electronics" },
        { id: "deal2", name: "BOGO Offer", discount: 50, category: "Snacks" },
        { id: "deal3", name: "Weekend Special", discount: 30, category: "Clothing" },
      ]

      deals.forEach((deal, index) => {
        objects.push({
          id: `deal-${deal.id}`,
          type: "deal",
          x: Math.sin(index * 2.1) * 200 + 300,
          y: Math.cos(index * 2.1) * 150 + 250,
          z: 50 + index * 20,
          scale: 0.8 + Math.sin(Date.now() * 0.001 + index) * 0.2,
          rotation: index * 120,
          data: deal,
          lastUpdate: now,
          stable: true,
        })
      })

      setArObjects(objects)
    }

    initializeARObjects()
  }, [shoppingList, creatures])

  // Stabilized AR object animation
  useEffect(() => {
    const animateARObjects = () => {
      const now = Date.now()
      const timeSinceLastMotion = now - lastSignificantMotion

      setArObjects((prev) =>
        prev.map((obj) => {
          const newObj = { ...obj }
          const shouldUpdate = timeSinceLastMotion < STABILITY_TIME || !obj.stable

          if (shouldUpdate) {
            const motionInfluence = isMoving ? motionIntensity * 3 : 1
            const orientationX = deviceMotion.orientation.gamma * 0.3
            const orientationY = deviceMotion.orientation.beta * 0.2

            if (obj.type === "creature" && obj.velocity) {
              newObj.x += obj.velocity.x * motionInfluence
              newObj.y += obj.velocity.y * motionInfluence
              newObj.z += obj.velocity.z * motionInfluence

              if (newObj.x < 0 || newObj.x > 400) obj.velocity.x *= -1
              if (newObj.y < 0 || newObj.y > 600) obj.velocity.y *= -1
              if (newObj.z < 10 || newObj.z > 200) obj.velocity.z *= -1
            }

            newObj.x += orientationX * 0.3
            newObj.y += orientationY * 0.3
            newObj.rotation += (obj.type === "creature" ? 2 : 0.5) * motionInfluence

            const timeOffset = Date.now() * 0.001 + obj.id.length
            newObj.y += Math.sin(timeOffset) * (obj.type === "creature" ? 3 : 1) * motionInfluence

            newObj.lastUpdate = now
            newObj.stable = timeSinceLastMotion > STABILITY_TIME
          }

          return newObj
        }),
      )
    }

    const interval = setInterval(animateARObjects, 50)
    return () => clearInterval(interval)
  }, [deviceMotion, isMoving, motionIntensity, lastSignificantMotion])

  // Start AR when tab is active
  useEffect(() => {
    if (activeTab === "ar") {
      initializeCamera()
      if (motionPermission === "prompt") {
        requestMotionPermission()
      }
    } else {
      stopCamera()
    }

    return () => stopCamera()
  }, [activeTab, initializeCamera, stopCamera, requestMotionPermission, motionPermission])

  // Calibrate AR with enhanced stability
  const calibrateAR = () => {
    setIsCalibrating(true)
    setMotionHistory([])
    setMotionIntensity(0)
    setIsMoving(false)
    setLastSignificantMotion(0)

    setTimeout(() => {
      setIsCalibrating(false)
      const now = Date.now()
      setArObjects((prev) =>
        prev.map((obj) => ({
          ...obj,
          x: obj.x + (Math.random() - 0.5) * 20,
          y: obj.y + (Math.random() - 0.5) * 20,
          lastUpdate: now,
          stable: true,
          velocity:
            obj.type === "creature"
              ? {
                  x: (Math.random() - 0.5) * 2,
                  y: (Math.random() - 0.5) * 1.5,
                  z: (Math.random() - 0.5) * 1,
                }
              : obj.velocity,
        })),
      )
    }, 2000)
  }

  // Enhanced item found with ecommerce integration
  const handleItemFound = (itemId: number) => {
    const item = shoppingList.find((i) => i.id === itemId)
    if (!item) return

    setShoppingList((prev) => prev.map((item) => (item.id === itemId ? { ...item, found: true, distance: 0 } : item)))
    setXp((prev) => prev + 50)
    setCoins((prev) => prev + 25)
    setFoundItems((prev) => prev + 1)

    // Add to cart automatically
    const cartItem: CartItem = {
      id: itemId,
      name: item.item,
      price: item.price,
      quantity: 1,
      image: item.creature ? creatures.find((c) => c.name === item.creature)?.emoji || "🛒" : "🛒",
      rating: item.rating,
      discount: item.discount,
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.id === itemId)
      if (existing) {
        return prev.map((c) => (c.id === itemId ? { ...c, quantity: c.quantity + 1 } : c))
      }
      return [...prev, cartItem]
    })

    setArObjects((prev) => prev.filter((obj) => obj.id !== `item-${itemId}`))

    // Update quest progress
    setActiveQuests((prev) =>
      prev.map((quest) => {
        if (quest.id === 1 && quest.progress < quest.total) {
          return { ...quest, progress: quest.progress + 1 }
        }
        return quest
      }),
    )

    // Play sound and show achievement
    if (soundEnabled) {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
      )
      audio.play().catch(() => {})
    }
  }

  const handleCreatureCaught = (creatureId: number) => {
    setCreatures((prev) =>
      prev.map((creature) => (creature.id === creatureId ? { ...creature, caught: true } : creature)),
    )
    setXp((prev) => prev + 100)
    setCoins((prev) => prev + 50)

    setArObjects((prev) => prev.filter((obj) => obj.id !== `creature-${creatureId}`))

    setActiveQuests((prev) =>
      prev.map((quest) => {
        if (quest.id === 2 && quest.progress < quest.total) {
          return { ...quest, progress: quest.progress + 1 }
        }
        return quest
      }),
    )

    if (soundEnabled) {
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT",
      )
      audio.play().catch(() => {})
    }
  }

  const handleScan = () => {
    setIsScanning(true)
    setTimeout(() => {
      setIsScanning(false)
      const nextItem = shoppingList.find((item) => !item.found)
      if (nextItem) {
        handleItemFound(nextItem.id)
      }
    }, 2000)
  }

  // Cart management
  const updateCartQuantity = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((item) => item.id !== id))
    } else {
      setCart((prev) => prev.map((item) => (item.id === id ? { ...item, quantity } : item)))
    }
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const discountedPrice = item.discount ? item.price * (1 - item.discount / 100) : item.price
      return total + discountedPrice * item.quantity
    }, 0)
  }

  const getCartSavings = () => {
    return cart.reduce((savings, item) => {
      if (item.discount) {
        return savings + item.price * (item.discount / 100) * item.quantity
      }
      return savings
    }, 0)
  }

  const nextItem = shoppingList.find((item) => !item.found)
  const completionPercentage = (foundItems / totalItems) * 100

  // Enhanced 3D position calculation with stability
  const calculate3DPosition = (obj: ARObject) => {
    const now = Date.now()
    const timeSinceUpdate = now - obj.lastUpdate
    const isStable = obj.stable && timeSinceUpdate > STABILITY_TIME

    const orientationX = isStable ? 0 : deviceMotion.orientation.gamma * 2
    const orientationY = isStable ? 0 : deviceMotion.orientation.beta * 1.5
    const motionOffset = isStable ? 0 : isMoving ? motionIntensity * 5 : 0

    return {
      x: obj.x + orientationX + motionOffset,
      y: obj.y + orientationY,
      scale: obj.scale * (1 + Math.sin(obj.z * 0.01) * 0.2) * (1 + (isStable ? 0 : motionIntensity * 0.1)),
      opacity: Math.max(0.3, 1 - obj.z / 300),
      blur: !isStable && isMoving && motionIntensity > 0.3 ? motionIntensity * 1.5 : 0,
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-100 to-indigo-200 flex flex-col items-center justify-center">
      {/* Camera feed with glass effect overlay, only visible in AR tab */}
      {/*{activeTab === "ar" && (
        <div className="w-full max-w-2xl aspect-video my-4 rounded-xl overflow-hidden shadow-lg">
          <CameraComponent />
        </div>
      )}*/}

      {/* PWA Install Banner */}
      {installPromptRef.current && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-red-500 to-red-600 p-3 text-center">
          <div className="flex items-center justify-between max-w-md mx-auto">
            <span className="text-sm font-medium">Install ShopQuest AR for the best experience!</span>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={installPWA} className="text-white hover:bg-white/20">
                <Download className="w-4 h-4 mr-1" />
                Install
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => (installPromptRef.current = null)}
                className="text-white hover:bg-white/20"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Animated Background */}
      <div className="fixed inset-0 opacity-10">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-red-500 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-blue-500 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 w-32 h-32 bg-green-500 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Enhanced Header with Glass Effect */}
      <div className="relative z-10 glass-3d border-b border-white/10 shadow-2xl">
        <div className="flex items-center justify-between p-4 max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/25">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-1">
                Level {level}
                <Crown className="w-3 h-3 text-yellow-400" />
              </div>
              <div className="text-xs text-gray-300 flex items-center gap-2">
                <span>{xp.toLocaleString()} XP</span>
                <span className="text-yellow-400">💰 {coins}</span>
                <span className="text-orange-400 flex items-center gap-1">
                  <Flame className="w-3 h-3" />
                  {streak}
                </span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="text-lg font-bold bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">
              ShopQuest AR
            </div>
            <div className="text-xs text-gray-400">Walmart Supercenter</div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" className="w-8 h-8 p-0 glass-3d" onClick={() => setShowCart(true)}>
              <div className="relative">
                <ShoppingCart className="w-4 h-4 text-blue-400" />
                {cart.length > 0 && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs flex items-center justify-center text-white">
                    {cart.length}
                  </div>
                )}
              </div>
            </Button>
            <Button size="sm" variant="ghost" className="w-8 h-8 p-0 glass-3d" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minus className="w-4 h-4 text-green-400" />
              ) : (
                <Plus className="w-4 h-4 text-green-400" />
              )}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="w-8 h-8 p-0 glass-3d"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-blue-400" />
              ) : (
                <VolumeX className="w-4 h-4 text-gray-400" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced XP Progress with Gamification */}
        <div className="px-4 pb-3 max-w-md mx-auto">
          <div className="relative">
            <Progress value={65} className="h-3 bg-white/10 border border-white/20" />
            <div
              className="absolute inset-0 bg-gradient-to-r from-red-500/50 to-red-600/50 rounded-full"
              style={{ width: "65%" }}
            ></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-xs font-bold text-white drop-shadow-lg">350 XP to Level 9</div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-400">Daily Streak: {streak} days</div>
            <div className="text-xs text-yellow-400 flex items-center gap-1">
              <Gem className="w-3 h-3" />
              Premium Member
            </div>
          </div>
        </div>
      </div>

      {/* Shopping Cart Modal */}
      {showCart && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-black rounded-t-3xl p-6 glass-3d border-t border-white/20 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Shopping Cart</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowCart(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Your cart is empty</p>
                <p className="text-sm text-gray-500">Start scanning items to add them!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 glass-3d rounded-xl">
                      <div className="text-2xl">{item.image}</div>
                      <div className="flex-1">
                        <div className="font-medium text-white">{item.name}</div>
                        <div className="text-sm text-gray-400 flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            {item.rating}
                          </span>
                          {item.discount && (
                            <Badge className="bg-red-500/20 text-red-400 border-red-500/30 text-xs">
                              -{item.discount}%
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {item.discount ? (
                            <>
                              <span className="text-lg font-bold text-green-400">
                                ${(item.price * (1 - item.discount / 100)).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">${item.price.toFixed(2)}</span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-white">${item.price.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 glass-3d"
                          onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="w-8 text-center font-bold">{item.quantity}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="w-8 h-8 p-0 glass-3d"
                          onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="glass-3d rounded-xl p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-400">Subtotal:</span>
                    <span className="text-white">${(getCartTotal() + getCartSavings()).toFixed(2)}</span>
                  </div>
                  {getCartSavings() > 0 && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-green-400">You Save:</span>
                      <span className="text-green-400">-${getCartSavings().toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-lg font-bold border-t border-white/20 pt-2">
                    <span className="text-white">Total:</span>
                    <span className="text-green-400">${getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25">
                  <CreditCard className="w-4 h-4 mr-2" />
                  Checkout (${getCartTotal().toFixed(2)})
                </Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative z-10 max-w-md mx-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          {/* Enhanced Tab Navigation with Glass Effect */}
          <div className="p-4">
            <TabsList className="grid w-full grid-cols-5 glass-3d border border-white/10 shadow-2xl">
              <TabsTrigger
                value="ar"
                className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:border-red-500/30 transition-all duration-300"
              >
                <Camera className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="list"
                className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 data-[state=active]:border-blue-500/30 transition-all duration-300"
              >
                <ShoppingCart className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="map"
                className="data-[state=active]:bg-green-500/20 data-[state=active]:text-green-400 data-[state=active]:border-green-500/30 transition-all duration-300"
              >
                <Map className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="creatures"
                className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30 transition-all duration-300"
              >
                <Gift className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger
                value="profile"
                className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400 data-[state=active]:border-yellow-500/30 transition-all duration-300"
              >
                <User className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="px-4 pb-4">
            <TabsContent value="ar" className="mt-0">
              {isARFullscreen ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center w-full max-w-md mx-auto px-4 pb-4">
                  <Card className="glass-3d border border-white/10 shadow-2xl w-full h-full flex flex-col items-center justify-center relative px-4 pb-4">
                    {/* Back/Close Button */}
                    <div className="absolute top-4 left-4 z-10">
                      <Button
                        size="icon"
                        className="w-12 h-12 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center shadow-lg"
                        onClick={() => setIsARFullscreen(false)}
                      >
                        <ArrowLeft className="w-7 h-7" />
                      </Button>
                    </div>
                    {/* Camera & Sensor Error Handling */}
                    {(!isCameraReady || !sensorsEnabled) && !demoMode ? (
                      <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                        {!isCameraReady && (
                          <div className="text-center">
                            <CameraComponent className="w-12 h-12 text-red-400 mx-auto mb-2" />
                            <div className="text-sm text-red-400 mb-2">Camera not ready or permission denied.</div>
                            <Button onClick={initializeCamera} className="bg-red-500 hover:bg-red-600 w-full max-w-xs mx-auto mb-2">
                              <CameraComponent className="w-4 h-4 mr-2" />
                              Enable Camera
                            </Button>
                          </div>
                        )}
                        {!sensorsEnabled && (
                          <div className="text-center">
                            <Smartphone className="w-12 h-12 text-blue-400 mx-auto mb-2" />
                            <div className="text-sm text-blue-400 mb-2">Motion sensors not enabled.</div>
                            <Button onClick={requestMotionPermission} className="bg-blue-500 hover:bg-blue-600 w-full max-w-xs mx-auto mb-2">
                              <Compass className="w-4 h-4 mr-2" />
                              Enable Motion Sensors
                            </Button>
                          </div>
                        )}
                        <Button onClick={() => setDemoMode(true)} className="bg-gray-700 hover:bg-gray-800 w-full max-w-xs mx-auto">
                          <Zap className="w-4 h-4 mr-2" />
                          {/* No demo mode text */}
                          Try AR
                        </Button>
                      </div>
                    ) : (
                      // Normal AR or Demo Mode
                      <div className="relative w-full h-full flex-1 flex flex-col items-center justify-center">
                        {/* Camera feed always visible in background */}
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover rounded-xl absolute inset-0 z-0"
                          autoPlay
                          playsInline
                          muted
                          style={{ transform: "scaleX(-1)" }}
                        />
                        {/* AR objects (real or demo) */}
                        {(demoMode
                          ? [1,2,3].map((n) => ({
                              id: `demo-${n}`,
                              type: n === 1 ? 'item' : n === 2 ? 'creature' : 'deal',
                              data: {
                                ...(n === 1 && { item: 'Demo Milk', price: 3.99, discount: 20 }),
                                ...(n === 2 && { emoji: '🦄', name: 'Demo Creature', power: 999 }),
                                ...(n === 3 && { name: 'Demo Deal', discount: 50, category: 'Demo' }),
                              },
                              x: 100 + n * 80,
                              y: 200 + n * 60,
                              scale: 1.2,
                              rotation: 0,
                            }) )
                          : arObjects.filter(obj => obj.type === 'item' || obj.type === 'creature' || obj.type === 'deal')
                        ).map((obj) => (
                          <ARObject
                            key={obj.id}
                            type={obj.type as 'item' | 'creature' | 'deal'}
                            data={obj.data}
                            style={{
                              left: `${Math.max(0, Math.min(100, (obj.x / 500) * 100))}%`,
                              top: `${Math.max(0, Math.min(100, (obj.y / 700) * 100))}%`,
                              position: "absolute",
                              transform: `translate(-50%, -50%) scale(${obj.scale}) rotateZ(${obj.rotation}deg)`
                            }}
                            onCatch={() => {
                              if (demoMode) return;
                              if (obj.type === "item") handleItemFound(obj.data.id)
                              if (obj.type === "creature") handleCreatureCaught(obj.data.id)
                            }}
                          />
                        ))}
                        {/* HUD and controls remain the same */}
                        <div className="absolute top-4 left-0 right-0 flex flex-col items-center gap-4 px-2 z-10">
                          <div className="flex flex-row justify-center items-center w-full max-w-xs mx-auto gap-2">
                            <div className="glass-3d rounded-xl p-2 flex-1 text-center shadow-lg">
                              <div className="text-xs text-gray-400">Next Item</div>
                              <div className="font-bold text-white text-sm">{nextItem?.item || "-"}</div>
                              <div className="text-xs text-green-400 flex items-center gap-1 justify-center">{nextItem?.distance} ft away</div>
                            </div>
                            <div className="glass-3d rounded-xl p-2 flex-1 text-center shadow-lg">
                              <div className="text-xs text-gray-400">Quest Timer</div>
                              <div className="font-bold text-orange-400 text-sm">{activeQuests.find((q) => q.active)?.timeLeft || "0:00"}</div>
                            </div>
                            <Button
                              size="icon"
                              className="w-12 h-12 rounded-full glass-3d border border-white/20 hover:bg-white/10 flex items-center justify-center"
                              onClick={calibrateAR}
                              disabled={isCalibrating}
                            >
                              <RotateCcw className={`w-6 h-6 ${isCalibrating ? "animate-spin" : ""}`} />
                            </Button>
                          </div>
                        </div>
                        <div className="absolute bottom-4 left-0 right-0 flex flex-col items-center gap-4 px-2 z-10">
                          <div className="flex flex-row justify-center items-center w-full max-w-xs mx-auto gap-2">
                            <Button
                              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg shadow-green-500/25 border border-green-400/30 glass-3d transition-all duration-300 hover:scale-105 flex-1 min-w-[44px] min-h-[44px]"
                              onClick={handleScan}
                              disabled={isScanning || !nextItem || !isARActive || !isCameraReady}
                            >
                              {isScanning ? (
                                <div className="flex items-center gap-2">
                                  <Scan className="w-4 h-4 animate-spin" />
                                  Scanning...
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Scan className="w-4 h-4" />
                                  Scan Item
                                </div>
                              )}
                            </Button>
                            <div className="text-center glass-3d rounded-xl p-3 border border-white/20 shadow-lg flex-1 min-w-[44px] min-h-[44px]">
                              <div className="text-xs text-gray-400">Progress</div>
                              <div className="text-2xl font-bold text-white">
                                {foundItems}/{totalItems}
                              </div>
                              <div className="w-16 h-1 bg-white/20 rounded-full mt-1 mx-auto">
                                <div
                                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                                  style={{ width: `${completionPercentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ) : (
                <Card className="glass-3d border border-white/10 shadow-2xl min-h-[500px] relative overflow-hidden">
                  {/* Sensor Permission Overlay */}
                  {!sensorsEnabled && motionPermission === "prompt" && (
                    <div className="absolute inset-0 glass-3d z-50 flex items-center justify-center">
                      <div className="text-center p-6">
                        <Smartphone className="w-16 h-16 text-blue-400 mx-auto mb-4 animate-pulse" />
                        <div className="text-lg font-bold text-white mb-2">Enable Motion Sensors</div>
                        <div className="text-sm text-gray-400 mb-4">
                          Allow motion and orientation access for immersive AR experience
                        </div>
                        <Button onClick={requestMotionPermission} className="bg-blue-500 hover:bg-blue-600">
                          <Compass className="w-4 h-4 mr-2" />
                          Enable Sensors
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Camera Feed */}
                  <div className="absolute inset-0">
                    {isARActive && isCameraReady && !cameraError ? (
                      <>
                        <video
                          ref={videoRef}
                          className="w-full h-full object-cover"
                          autoPlay
                          playsInline
                          muted
                          style={{ transform: "scaleX(-1)" }}
                        />
                        {/* Glass overlay for UI integration */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/20 pointer-events-none"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
                        {cameraError ? (
                          <div className="text-center p-4 glass-3d rounded-xl">
                            <CameraComponent className="w-12 h-12 text-red-400 mx-auto mb-2" />
                            <div className="text-sm text-red-400 mb-4 max-w-xs">{cameraError}</div>
                            <Button onClick={initializeCamera} className="bg-red-500 hover:bg-red-600">
                              <CameraComponent className="w-4 h-4 mr-2" />
                              Retry Camera
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center p-4 glass-3d rounded-xl">
                            <CameraComponent className="w-12 h-12 text-blue-400 mx-auto mb-2 animate-pulse" />
                            <div className="text-sm text-gray-400 mb-2">
                              {isARActive ? "Loading camera..." : "Initializing AR..."}
                            </div>
                            <div className="w-32 h-1 bg-white/20 rounded-full mx-auto">
                              <div
                                className="h-full bg-blue-500 rounded-full animate-pulse"
                                style={{ width: "60%" }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enhanced AR Grid Overlay */}
                  {isARActive && isCameraReady && (
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                      <div className="grid grid-cols-8 grid-rows-12 h-full w-full">
                        {Array.from({ length: 96 }).map((_, i) => (
                          <div key={i} className="border border-blue-500/30 ar-grid"></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stabilized 3D AR Objects */}
                  <div ref={arContainerRef} className="absolute inset-0 pointer-events-none">
                    {arObjects.filter(obj => obj.type === 'item' || obj.type === 'creature' || obj.type === 'deal').map((obj) => {
                      const pos = calculate3DPosition(obj)
                      return (
                        <div
                          key={obj.id}
                          className="absolute pointer-events-auto cursor-pointer transition-all duration-100 ar-object"
                          style={{
                            left: `${Math.max(0, Math.min(100, (pos.x / 500) * 100))}%`,
                            top: `${Math.max(0, Math.min(100, (pos.y / 700) * 100))}%`,
                            transform: `translate(-50%, -50%) scale(${pos.scale}) rotateZ(${obj.rotation}deg) perspective(1000px) rotateX(${deviceMotion.orientation.beta * 0.2}deg) rotateY(${deviceMotion.orientation.gamma * 0.2}deg)`,
                            opacity: pos.opacity,
                            zIndex: Math.floor(100 - obj.z),
                            filter: pos.blur > 0 ? `blur(${pos.blur}px)` : "none",
                          }}
                          onClick={() => {
                            if (obj.type === "item") {
                              handleItemFound(obj.data.id)
                            } else if (obj.type === "creature") {
                              handleCreatureCaught(obj.data.id)
                            }
                          }}
                        >
                          {obj.type === "item" && (
                            <div className="relative">
                              <div className="glass-3d text-white px-3 py-2 rounded-full text-xs font-bold shadow-lg border border-green-400/30 animate-pulse">
                                <div className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {obj.data.item}
                                  {obj.data.discount && (
                                    <Badge className="bg-red-500/80 text-white text-xs ml-1">
                                      -{obj.data.discount}%
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-xs text-green-300 mt-1">${obj.data.price}</div>
                              </div>
                              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 text-2xl animate-bounce">
                                ↓
                              </div>
                            </div>
                          )}

                          {obj.type === "creature" && (
                            <div className="relative">
                              <div className="glass-3d text-black p-3 rounded-full shadow-lg border border-yellow-400/50 hover:scale-110 transition-transform duration-200 animate-bounce">
                                <div className="text-2xl">{obj.data.emoji}</div>
                              </div>
                              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-center glass-3d rounded-full px-2 py-1 border border-white/20 whitespace-nowrap">
                                <div className="text-white font-bold">{obj.data.name}</div>
                                <div className="text-yellow-400 text-xs">⚡ {obj.data.power}</div>
                              </div>
                            </div>
                          )}

                          {obj.type === "deal" && (
                            <div className="relative">
                              <div className="glass-3d bg-gradient-to-r from-red-500/80 to-orange-500/80 text-white p-3 rounded-xl shadow-lg border border-red-400/50 animate-pulse">
                                <div className="text-xs font-bold">{obj.data.name}</div>
                                <div className="text-lg font-bold">-{obj.data.discount}%</div>
                                <div className="text-xs">{obj.data.category}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Enhanced Scanning Effect */}
                  {isScanning && (
                    <div className="absolute inset-0 bg-red-500/10 glass-3d pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                        <div className="w-32 h-32 border-4 border-red-500 rounded-full animate-ping"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <Scan className="w-8 h-8 text-red-500 animate-spin" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Enhanced Calibration Effect */}
                  {isCalibrating && (
                    <div className="absolute inset-0 glass-3d pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="w-24 h-24 border-4 border-blue-500 rounded-full animate-spin mb-4 calibrate-animation"></div>
                        <div className="text-blue-400 font-bold">Calibrating AR...</div>
                        <div className="text-xs text-gray-400 mt-1">Stabilizing sensors...</div>
                      </div>
                    </div>
                  )}
                </Card>
              )}

              {/* Add a button to enter fullscreen */}
              <div className="absolute bottom-4 right-4 z-20">
                <Button
                  size="icon"
                  className="w-14 h-14 rounded-full bg-white/20 text-white text-2xl flex items-center justify-center"
                  onClick={() => setIsARFullscreen(true)}
                >
                  <Camera className="w-8 h-8" />
                </Button>
              </div>

              {/* Enhanced AR Controls with Glass Effect */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  className="glass-3d border border-white/20 hover:bg-white/10 w-10 h-10 p-0"
                  onClick={calibrateAR}
                  disabled={isCalibrating}
                >
                  <RotateCcw className={`w-4 h-4 ${isCalibrating ? "animate-spin" : ""}`} />
                </Button>

                {/* Enhanced Motion Status Indicator */}
                <div
                  className={`w-10 h-10 rounded-full border-2 flex items-center justify-center glass-3d ${
                    sensorsEnabled
                      ? isMoving
                        ? "border-green-500 bg-green-500/20"
                        : "border-blue-500 bg-blue-500/20"
                      : "border-gray-500 bg-gray-500/20"
                  }`}
                >
                  <Smartphone
                    className={`w-4 h-4 ${
                      sensorsEnabled ? (isMoving ? "text-green-400 animate-pulse" : "text-blue-400") : "text-gray-400"
                    }`}
                  />
                </div>

                {/* Stability Indicator */}
                <div className="glass-3d rounded-full p-2 border border-white/20">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      Date.now() - lastSignificantMotion > STABILITY_TIME ? "bg-green-400" : "bg-orange-400"
                    }`}
                  ></div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="list" className="mt-0 space-y-4">
              {/* Active Quests */}
              <Card
                ref={(el) => (cardRefs.current[0] = el)}
                className="glass-3d border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-red-400" />
                    Active Quests
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeQuests.map((quest) => (
                    <div key={quest.id} className="glass-3d rounded-xl p-4 border border-white/10 shadow-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-bold text-white">{quest.title}</div>
                          <div className="text-sm text-gray-400">{quest.description}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {quest.timeLeft}
                          </div>
                          <div className="text-sm font-bold text-yellow-400">+{quest.reward} XP</div>
                        </div>
                      </div>
                      <div className="relative">
                        <Progress value={(quest.progress / quest.total) * 100} className="h-2 bg-white/10" />
                        <div
                          className="absolute inset-0 bg-gradient-to-r from-blue-500/50 to-blue-600/50 rounded-full transition-all duration-500"
                          style={{ width: `${(quest.progress / quest.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-xs mt-2 text-gray-400">
                        {quest.progress}/{quest.total} completed
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Shopping List with Ecommerce Details */}
              <Card
                ref={(el) => (cardRefs.current[1] = el)}
                className="glass-3d border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <ShoppingCart className="w-5 h-5 text-blue-400" />
                    Shopping List
                    <Input
                      type="text"
                      placeholder="Search items..."
                      className="ml-auto w-32 h-8 glass-3d border-white/20 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Button size="sm" variant="ghost" className="w-8 h-8 p-0 glass-3d">
                      <Filter className="w-4 h-4" />
                    </Button>
                  </CardTitle>
                  <div className="text-xs text-gray-400 mt-2">
                    Price Range: ${priceRange[0]} - ${priceRange[1]}
                  </div>
                  <Slider
                    defaultValue={[0, 100]}
                    max={100}
                    step={1}
                    onValueChange={setPriceRange}
                    className="w-full mt-2"
                  />
                </CardHeader>
                <CardContent className="space-y-3">
                  {shoppingList
                    .filter(
                      (item) =>
                        item.item.toLowerCase().includes(searchQuery.toLowerCase()) &&
                        item.price >= priceRange[0] &&
                        item.price <= priceRange[1],
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                          item.found
                            ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10"
                            : "glass-3d border-white/10 hover:bg-white/10"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                              item.found
                                ? "bg-green-500 border-green-500 shadow-lg shadow-green-500/25"
                                : "border-white/40 hover:border-white/60"
                            }`}
                          >
                            {item.found && <CheckCircle className="w-3 h-3 text-white" />}
                          </div>
                          <div>
                            <div
                              className={`font-medium transition-all duration-300 ${item.found ? "line-through text-gray-400" : "text-white"}`}
                            >
                              {item.item}
                            </div>
                            <div className="text-xs text-gray-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Aisle {item.aisle}
                              {!item.found && item.distance > 0 && (
                                <span className="text-blue-400">• {item.distance}ft</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.discount ? (
                                <>
                                  <span className="text-sm font-bold text-green-400">
                                    ${(item.price * (1 - item.discount / 100)).toFixed(2)}
                                  </span>
                                  <span className="text-xs text-gray-400 line-through">${item.price.toFixed(2)}</span>
                                </>
                              ) : (
                                <span className="text-sm font-bold text-white">${item.price.toFixed(2)}</span>
                              )}
                              <span className="flex items-center text-xs text-yellow-400">
                                <Star className="w-3 h-3 mr-1" />
                                {item.rating} ({item.reviews})
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.creature && (
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                              🎮 {item.creature}
                            </Badge>
                          )}
                          {!item.found && (
                            <Button
                              size="sm"
                              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 border border-red-400/30 transition-all duration-300 hover:scale-105"
                              onClick={() => setActiveTab("ar")}
                            >
                              Find
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="w-8 h-8 p-0 glass-3d"
                            onClick={() =>
                              updateCartQuantity(item.id, (cart.find((c) => c.id === item.id)?.quantity || 0) + 1)
                            }
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="map" className="mt-0">
              <Card
                ref={(el) => (cardRefs.current[2] = el)}
                className="glass-3d border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Map className="w-5 h-5 text-green-400" />
                    Motion-Responsive 3D Map
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-black/40 glass-3d rounded-xl p-4 h-96 relative border border-white/10 shadow-inner perspective-1000">
                    {/* 3D Store Layout with Motion Response */}
                    <div
                      className="grid grid-cols-4 gap-3 h-full transform-gpu transition-transform duration-300"
                      style={{
                        transform: `rotateX(${deviceMotion.orientation.beta * 0.3}deg) rotateY(${deviceMotion.orientation.gamma * 0.3}deg) scale(${1 + motionIntensity * 0.1})`,
                      }}
                    >
                      <div className="glass-3d rounded-lg flex items-center justify-center text-xs text-center border border-blue-500/30 backdrop-blur-sm transform-gpu hover:scale-105 transition-transform duration-300">
                        <div>
                          <div className="text-blue-400 font-bold">Produce</div>
                          <div className="text-gray-400">C1-C5</div>
                          <div className="text-xs text-blue-300 mt-1">🍌 Bananas</div>
                        </div>
                      </div>
                      <div className="glass-3d rounded-lg flex items-center justify-center text-xs text-center border border-yellow-500/30 backdrop-blur-sm transform-gpu hover:scale-105 transition-transform duration-300">
                        <div>
                          <div className="text-yellow-400 font-bold">Dairy</div>
                          <div className="text-gray-400">A10-A15</div>
                          <div className="text-xs text-yellow-300 mt-1">🥚 Eggs</div>
                        </div>
                      </div>
                      <div className="glass-3d rounded-lg flex items-center justify-center text-xs text-center border border-red-500/30 backdrop-blur-sm transform-gpu hover:scale-105 transition-transform duration-300">
                        <div>
                          <div className="text-red-400 font-bold">Meat</div>
                          <div className="text-gray-400">D10-D20</div>
                          <div className="text-xs text-red-300 mt-1">🐔 Chicken</div>
                        </div>
                      </div>
                      <div className="glass-3d rounded-lg flex items-center justify-center text-xs text-center border border-purple-500/30 backdrop-blur-sm transform-gpu hover:scale-105 transition-transform duration-300">
                        <div>
                          <div className="text-purple-400 font-bold">Frozen</div>
                          <div className="text-gray-400">F1-F10</div>
                        </div>
                      </div>
                    </div>

                    {/* Motion-responsive indicators */}
                    <div className="absolute top-6 left-6 flex items-center gap-2 transform-gpu animate-pulse">
                      <div
                        className={`w-3 h-3 rounded-full shadow-lg ${
                          isMoving ? "bg-green-500 shadow-green-500/50" : "bg-red-500 shadow-red-500/50"
                        }`}
                      ></div>
                      <div className="text-xs font-medium">{isMoving ? "Moving" : "You are here"}</div>
                    </div>

                    {/* Dynamic item indicators with motion influence */}
                    <div
                      className="absolute top-1/2 left-1/4 w-3 h-3 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50 transform-gpu"
                      style={{
                        transform: `translateZ(${10 + motionIntensity * 5}px) scale(${1 + Math.sin(Date.now() * 0.003) * 0.2 + motionIntensity * 0.3})`,
                      }}
                    ></div>
                    <div
                      className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-blue-400 rounded-full animate-pulse shadow-lg shadow-blue-400/50 transform-gpu"
                      style={{
                        transform: `translateZ(${15 + motionIntensity * 8}px) scale(${1 + Math.sin(Date.now() * 0.003 + 1) * 0.2 + motionIntensity * 0.3})`,
                      }}
                    ></div>
                    <div
                      className="absolute top-1/3 right-1/3 w-3 h-3 bg-yellow-400 rounded-full animate-pulse shadow-lg shadow-yellow-400/50 transform-gpu"
                      style={{
                        transform: `translateZ(${5 + motionIntensity * 3}px) scale(${1 + Math.sin(Date.now() * 0.003 + 2) * 0.2 + motionIntensity * 0.3})`,
                      }}
                    ></div>
                  </div>

                  {/* Enhanced 3D Controls */}
                  <div className="mt-4 text-center">
                    <div className="text-xs text-gray-400 mb-2">
                      {sensorsEnabled
                        ? "Move your device to explore the 3D map"
                        : "Enable sensors for motion-responsive mapping"}
                    </div>
                    <div className="flex justify-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="glass-3d border-white/20 hover:bg-white/10 bg-transparent"
                        onClick={calibrateAR}
                      >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Reset View
                      </Button>
                      {!sensorsEnabled && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-blue-500/20 border-blue-500/30 hover:bg-blue-500/30"
                          onClick={requestMotionPermission}
                        >
                          <Smartphone className="w-4 h-4 mr-2" />
                          Enable Motion
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="creatures" className="mt-0">
              <Card
                ref={(el) => (cardRefs.current[3] = el)}
                className="glass-3d border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-purple-400" />
                    Motion-Enhanced Creatures
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {creatures.map((creature, index) => (
                      <div
                        key={creature.id}
                        className={`p-4 rounded-xl border transition-all duration-300 hover:scale-105 cursor-pointer transform-gpu ${
                          creature.caught
                            ? "bg-green-500/10 border-green-500/30 shadow-lg shadow-green-500/10"
                            : "glass-3d border-white/10 hover:bg-white/10"
                        }`}
                        style={{
                          transform: `perspective(1000px) rotateX(${Math.sin(Date.now() * 0.001 + index) * 5 + deviceMotion.orientation.beta * 0.1}deg) rotateY(${Math.cos(Date.now() * 0.001 + index) * 5 + deviceMotion.orientation.gamma * 0.1}deg) scale(${1 + motionIntensity * 0.1})`,
                        }}
                        onClick={() => !creature.caught && handleCreatureCaught(creature.id)}
                      >
                        <div className="text-center">
                          <div
                            className="text-4xl mb-2 filter drop-shadow-lg transform-gpu transition-transform duration-300"
                            style={{
                              transform: `scale(${1 + Math.sin(Date.now() * 0.002 + index) * 0.1 + motionIntensity * 0.2})`,
                            }}
                          >
                            {creature.caught ? creature.emoji : "❓"}
                          </div>
                          <div className="font-bold text-white">{creature.caught ? creature.name : "???"}</div>
                          <div className="text-xs text-gray-400 mb-2">{creature.category}</div>
                          <Badge
                            className={`text-xs ${
                              creature.rarity === "Rare"
                                ? "bg-red-500/20 text-red-400 border-red-500/30"
                                : creature.rarity === "Uncommon"
                                  ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                                  : "bg-gray-500/20 text-gray-400 border-gray-500/30"
                            }`}
                          >
                            {creature.rarity}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="profile" className="mt-0">
              <Card
                ref={(el) => (cardRefs.current[4] = el)}
                className="glass-3d border border-white/10 shadow-2xl transition-all duration-300 hover:bg-white/10"
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5 text-yellow-400" />
                    AR Player Profile
                    <Button
                      size="sm"
                      variant="ghost"
                      className="ml-auto glass-3d"
                      onClick={() => setShowAchievements(true)}
                    >
                      <Trophy className="w-4 h-4 mr-1" />
                      Achievements
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center">
                    <div
                      className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl shadow-lg shadow-yellow-500/25 border border-yellow-400/30 transform-gpu"
                      style={{
                        transform: `perspective(1000px) rotateY(${Math.sin(Date.now() * 0.001) * 10 + deviceMotion.orientation.gamma * 0.2}deg) scale(${1 + motionIntensity * 0.1})`,
                      }}
                    >
                      🏆
                    </div>
                    <div className="font-bold text-xl text-white">AR ShopMaster</div>
                    <div className="text-sm text-gray-400">
                      Level {level} • {xp.toLocaleString()} XP
                    </div>
                    <div className="text-xs text-blue-400 mt-1">AR Sessions: {Math.floor(Math.random() * 50) + 20}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-3d rounded-xl p-4 text-center border border-green-500/20 shadow-lg transform-gpu hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-green-400">{foundItems + 45}</div>
                      <div className="text-xs text-gray-400">Items Found</div>
                    </div>
                    <div className="glass-3d rounded-xl p-4 text-center border border-purple-500/20 shadow-lg transform-gpu hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-purple-400">
                        {creatures.filter((c) => c.caught).length}
                      </div>
                      <div className="text-xs text-gray-400">AR Creatures</div>
                    </div>
                    <div className="glass-3d rounded-xl p-4 text-center border border-blue-500/20 shadow-lg transform-gpu hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-blue-400">8</div>
                      <div className="text-xs text-gray-400">AR Quests</div>
                    </div>
                    <div className="glass-3d rounded-xl p-4 text-center border border-yellow-500/20 shadow-lg transform-gpu hover:scale-105 transition-transform duration-300">
                      <div className="text-2xl font-bold text-yellow-400">${getCartSavings().toFixed(2)}</div>
                      <div className="text-xs text-gray-400">AR Savings</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="font-bold text-white">AR Achievements</div>
                    <div className="space-y-2">
                      {achievements.slice(0, 2).map((achievement) => (
                        <div
                          key={achievement.id}
                          className="flex items-center gap-3 glass-3d rounded-xl p-3 border border-white/10 shadow-lg transform-gpu hover:scale-105 transition-transform duration-300"
                        >
                          <span className="text-xl">{achievement.icon}</span>
                          <span className="text-sm text-white">{achievement.title}</span>
                          {achievement.unlocked ? (
                            <Check className="w-4 h-4 text-green-400 ml-auto" />
                          ) : (
                            <Progress
                              value={(achievement.progress / achievement.maxProgress) * 100}
                              className="h-2 w-16 ml-auto"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Motion Statistics */}
                  <div className="glass-3d rounded-xl p-4 border border-white/10">
                    <div className="text-sm font-bold text-white mb-3">Motion Analytics</div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <div className="text-gray-400">Current Motion</div>
                        <div className={`font-bold ${isMoving ? "text-green-400" : "text-gray-400"}`}>
                          {isMoving ? `${Math.round(motionIntensity * 100)}% Active` : "Stationary"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Sensor Status</div>
                        <div className={`font-bold ${sensorsEnabled ? "text-green-400" : "text-red-400"}`}>
                          {sensorsEnabled ? "Connected" : "Disconnected"}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-400">Total Movements</div>
                        <div className="font-bold text-blue-400">{motionHistory.length * 47}</div>
                      </div>
                      <div>
                        <div className="text-gray-400">AR Accuracy</div>
                        <div className="font-bold text-purple-400">{sensorsEnabled ? "98%" : "45%"}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>

      {/* Achievements Modal */}
      {showAchievements && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="w-full max-w-md mx-auto bg-gradient-to-br from-gray-900 to-black rounded-xl p-6 glass-3d border border-white/20 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Achievements</h2>
              <Button size="sm" variant="ghost" onClick={() => setShowAchievements(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="space-y-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="glass-3d rounded-xl p-4 border border-white/10 shadow-lg">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-4xl">{achievement.icon}</span>
                    <div>
                      <div className="font-bold text-white">{achievement.title}</div>
                      <div className="text-sm text-gray-400">{achievement.description}</div>
                    </div>
                  </div>
                  {achievement.unlocked ? (
                    <div className="flex items-center gap-2 text-green-400 font-bold">
                      <Check className="w-4 h-4" />
                      Unlocked! (+{achievement.reward} XP)
                    </div>
                  ) : (
                    <>
                      <Progress value={(achievement.progress / achievement.maxProgress) * 100} className="h-2" />
                      <div className="text-xs text-gray-400 mt-1">
                        {achievement.progress}/{achievement.maxProgress} progress
                      </div>
                      <div className="text-xs text-yellow-400 mt-1">Reward: +{achievement.reward} XP</div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
