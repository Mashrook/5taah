import UIKit
import WebKit

struct AppConfig {

    static let websiteURL  = "https://5taah-production.up.railway.app"
    static let appName     = "خته"
    static let appSubtitle = "حجز الطيران والفنادق"
    static let appVersion  = "1.0.0"
    static let bundleID    = "com.5atth.app"

    struct Colors {
        static let primary          = UIColor(hex: "#FF4500")
        static let primaryLight     = UIColor(hex: "#FF6622")
        static let primaryDark      = UIColor(hex: "#D93300")
        static let background       = UIColor(hex: "#FFFFFF")
        static let backgroundGray   = UIColor(hex: "#F7F7F7")
        static let navbar           = UIColor(hex: "#FFFFFF")
        static let navbarBorder     = UIColor(hex: "#EEEEEE")
        static let textPrimary      = UIColor(hex: "#222222")
        static let textSecondary    = UIColor(hex: "#737373")
        static let splashBackground = UIColor(hex: "#FF4500")
        static let splashText       = UIColor(hex: "#FFFFFF")
        static let progressBar      = UIColor(hex: "#FF4500")
        static let loadingIndicator = UIColor(hex: "#FF4500")
        static let error            = UIColor(hex: "#FF3B30")
        static let success          = UIColor(hex: "#34C759")
    }

    struct WebView {
        static let allowedDomains: [String] = [
            "5taah-production.up.railway.app",
            "railway.app",
            "supabase.co",
            "yxojwultjidolgiwyktl.supabase.co",
            "moyasar.com",
            "api.moyasar.com",
            "cdn.moyasar.com",
            "api.amadeus.com",
            "test.api.amadeus.com",
            "travelpayouts.com",
            "aviasales.com",
            "fonts.googleapis.com",
            "fonts.gstatic.com"
        ]
        static let externalDomains: [String] = [
            "apple.com",
            "appleid.apple.com"
        ]
        static let javaScriptEnabled                    = true
        static let allowFileAccess                      = false
        static let allowInlineMediaPlayback             = true
        static let mediaTypesRequiringUserAction: WKAudiovisualMediaTypes = []
        static let cachePolicy: URLRequest.CachePolicy  = .useProtocolCachePolicy
    }

    struct Splash {
        static let duration: Double          = 2.5
        static let animationDuration: Double = 0.7
        static let logoSize: CGFloat         = 130
    }

    struct Settings {
        static let pullToRefreshEnabled = true
        static let swipeBackEnabled     = true
        static let cacheEnabled         = true
    }
}

extension UIColor {
    convenience init(hex: String, alpha: CGFloat = 1.0) {
        var h = hex.trimmingCharacters(in: .whitespacesAndNewlines)
            .replacingOccurrences(of: "#", with: "")
        if h.count == 3 { h = h.map { "\($0)\($0)" }.joined() }
        var rgb: UInt64 = 0
        Scanner(string: h).scanHexInt64(&rgb)
        let r = CGFloat((rgb & 0xFF0000) >> 16) / 255
        let g = CGFloat((rgb & 0x00FF00) >> 8)  / 255
        let b = CGFloat(rgb & 0x0000FF)          / 255
        self.init(red: r, green: g, blue: b, alpha: alpha)
    }
}
