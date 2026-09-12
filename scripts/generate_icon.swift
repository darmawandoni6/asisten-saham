import Cocoa
import CoreGraphics

let size = CGSize(width: 1024, height: 1024)
let colorSpace = CGColorSpace(name: CGColorSpace.sRGB)!
let context = CGContext(
    data: nil,
    width: Int(size.width),
    height: Int(size.height),
    bitsPerComponent: 8,
    bytesPerRow: 0,
    space: colorSpace,
    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue
)!

// Background App Icon Shape (macOS Squircle style)
let rect = CGRect(x: 64, y: 64, width: 896, height: 896)
let cornerRadius: CGFloat = 200.0
let clipPath = CGPath(roundedRect: rect, cornerWidth: cornerRadius, cornerHeight: cornerRadius, transform: nil)

// Shadow for squircle
context.saveGState()
context.setShadow(offset: CGSize(width: 0, height: -20), blur: 40, color: CGColor(red: 0, green: 0, blue: 0, alpha: 0.35))
context.addPath(clipPath)
context.setFillColor(CGColor(red: 0.05, green: 0.1, blue: 0.18, alpha: 1.0)) // Deep navy slate
context.fillPath()
context.restoreGState()

context.saveGState()
context.addPath(clipPath)
context.clip()

// Gradient Background (Deep Slate Blue to Emerald Dark)
let gradientColors = [
    CGColor(red: 0.06, green: 0.12, blue: 0.22, alpha: 1.0), // Slate Navy #0f1f38
    CGColor(red: 0.03, green: 0.20, blue: 0.18, alpha: 1.0), // Deep Emerald Teal #08332e
    CGColor(red: 0.02, green: 0.28, blue: 0.22, alpha: 1.0)  // Rich Emerald #054738
] as CFArray

let locations: [CGFloat] = [0.0, 0.6, 1.0]
let bgGradient = CGGradient(colorsSpace: colorSpace, colors: gradientColors, locations: locations)!
context.drawLinearGradient(bgGradient, start: CGPoint(x: 512, y: 960), end: CGPoint(x: 512, y: 64), options: [])

// Subtle grid lines
context.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.06))
context.setLineWidth(2.0)
for y in stride(from: 200, to: 850, by: 120) {
    context.move(to: CGPoint(x: 100, y: CGFloat(y)))
    context.addLine(to: CGPoint(x: 924, y: CGFloat(y)))
    context.strokePath()
}
for x in stride(from: 200, to: 850, by: 150) {
    context.move(to: CGPoint(x: CGFloat(x), y: 100))
    context.addLine(to: CGPoint(x: CGFloat(x), y: 924))
    context.strokePath()
}

// Draw Candlesticks (Stock market aesthetic)
struct Candlestick {
    let x: CGFloat
    let high: CGFloat
    let low: CGFloat
    let open: CGFloat
    let close: CGFloat
    let isBull: Bool
}

let candles: [Candlestick] = [
    Candlestick(x: 230, high: 460, low: 260, open: 300, close: 420, isBull: true),
    Candlestick(x: 340, high: 540, low: 360, open: 440, close: 380, isBull: false),
    Candlestick(x: 450, high: 620, low: 360, open: 390, close: 580, isBull: true),
    Candlestick(x: 560, high: 710, low: 480, open: 590, close: 510, isBull: false),
    Candlestick(x: 670, high: 800, low: 490, open: 530, close: 760, isBull: true),
    Candlestick(x: 780, high: 860, low: 680, open: 740, close: 830, isBull: true)
]

let emeraldFill = CGColor(red: 0.06, green: 0.78, blue: 0.52, alpha: 1.0) // #10c784
let emeraldStroke = CGColor(red: 0.35, green: 0.95, blue: 0.70, alpha: 1.0)
let crimsonFill = CGColor(red: 0.92, green: 0.28, blue: 0.35, alpha: 0.9) // #eb4759
let crimsonStroke = CGColor(red: 1.0, green: 0.45, blue: 0.50, alpha: 1.0)

for candle in candles {
    let bodyTop = max(candle.open, candle.close)
    let bodyBottom = min(candle.open, candle.close)
    let bodyHeight = max(bodyTop - bodyBottom, 12.0)
    let bodyWidth: CGFloat = 52.0
    let bodyRect = CGRect(x: candle.x - bodyWidth/2, y: bodyBottom, width: bodyWidth, height: bodyHeight)
    
    let color = candle.isBull ? emeraldFill : crimsonFill
    let stroke = candle.isBull ? emeraldStroke : crimsonStroke
    
    // Wick
    context.setStrokeColor(stroke)
    context.setLineWidth(6.0)
    context.setLineCap(.round)
    context.move(to: CGPoint(x: candle.x, y: candle.low))
    context.addLine(to: CGPoint(x: candle.x, y: candle.high))
    context.strokePath()
    
    // Body with rounded corners
    let candlePath = CGPath(roundedRect: bodyRect, cornerWidth: 8, cornerHeight: 8, transform: nil)
    context.setFillColor(color)
    context.addPath(candlePath)
    context.fillPath()
}

// Glowing Trendline overlay
context.saveGState()
context.setShadow(offset: CGSize(width: 0, height: 0), blur: 25, color: CGColor(red: 0.2, green: 1.0, blue: 0.7, alpha: 0.85))
let trendPath = CGMutablePath()
trendPath.move(to: CGPoint(x: 210, y: 350))
trendPath.addCurve(to: CGPoint(x: 450, y: 500), control1: CGPoint(x: 300, y: 340), control2: CGPoint(x: 380, y: 460))
trendPath.addCurve(to: CGPoint(x: 790, y: 840), control1: CGPoint(x: 550, y: 550), control2: CGPoint(x: 680, y: 780))

context.setStrokeColor(CGColor(red: 0.4, green: 1.0, blue: 0.8, alpha: 0.95))
context.setLineWidth(9.0)
context.setLineCap(.round)
context.addPath(trendPath)
context.strokePath()
context.restoreGState()

// End pulse dot on trendline
context.saveGState()
context.setShadow(offset: .zero, blur: 20, color: CGColor(red: 0.3, green: 1.0, blue: 0.7, alpha: 1.0))
context.setFillColor(CGColor(red: 1.0, green: 1.0, blue: 1.0, alpha: 1.0))
context.fillEllipse(in: CGRect(x: 778, y: 828, width: 24, height: 24))
context.restoreGState()

// Bottom Badge "IDX" / "ASISTEN SAHAM"
let titleRect = CGRect(x: 212, y: 130, width: 600, height: 80)
let titleBadgePath = CGPath(roundedRect: titleRect, cornerWidth: 20, cornerHeight: 20, transform: nil)
context.setFillColor(CGColor(red: 0.04, green: 0.08, blue: 0.15, alpha: 0.85))
context.addPath(titleBadgePath)
context.fillPath()
context.setStrokeColor(CGColor(red: 0.1, green: 0.78, blue: 0.55, alpha: 0.4))
context.setLineWidth(2.5)
context.addPath(titleBadgePath)
context.strokePath()

// Draw Text "ASISTEN SAHAM"
let font = CTFontCreateWithName("HelveticaNeue-Bold" as CFString, 42, nil)
let attributes: [NSAttributedString.Key: Any] = [
    .font: font,
    .foregroundColor: CGColor(red: 0.95, green: 0.98, blue: 1.0, alpha: 1.0)
]
let attrString = NSAttributedString(string: "ASISTEN SAHAM", attributes: attributes)
let line = CTLineCreateWithAttributedString(attrString)
let lineBounds = CTLineGetImageBounds(line, context)
let textX = titleRect.midX - lineBounds.width / 2.0
let textY = titleRect.midY - lineBounds.height / 2.0 + 8.0

context.textPosition = CGPoint(x: textX, y: textY)
CTLineDraw(line, context)

// Subtle Inner Border Highlight for squircle
context.restoreGState()
context.saveGState()
context.addPath(clipPath)
context.setStrokeColor(CGColor(red: 1, green: 1, blue: 1, alpha: 0.25))
context.setLineWidth(4.0)
context.strokePath()
context.restoreGState()

// Export to PNG
let image = context.makeImage()!
let bitmapRep = NSBitmapImageRep(cgImage: image)
let pngData = bitmapRep.representation(using: .png, properties: [:])!
let outputPath = URL(fileURLWithPath: "scripts/icon_1024.png")
try! pngData.write(to: outputPath)
print("Successfully generated icon at \(outputPath.path)")
