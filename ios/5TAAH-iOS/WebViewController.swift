import UIKit
import WebKit

class WebViewController: UIViewController {
    
    var webView: WKWebView!
    var progressView: UIProgressView!
    var activityIndicator: UIActivityIndicatorView!
    
    let targetURL = "https://5taah-production.up.railway.app"
    
    override func viewDidLoad() {
        super.viewDidLoad()
        setupWebView()
        setupProgressView()
        setupActivityIndicator()
        loadWebsite()
    }
    
    func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = true
        config.mediaTypesRequiringUserActionForPlayback = []
        
        // دعم الدفع عبر الإنترنت
        let preferences = WKWebpagePreferences()
        preferences.allowsContentJavaScript = true
        config.defaultWebpagePreferences = preferences
        
        // للتعامل مع روابط الدفع الخارجية
        let userContentController = WKUserContentController()
        userContentController.add(self, name: "paymentHandler")
        config.userContentController = userContentController
        
        webView = WKWebView(frame: view.bounds, configuration: config)
        webView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        webView.navigationDelegate = self
        webView.uiDelegate = self
        
        // إضافة Observer لتتبع التحميل
        webView.addObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress), options: .new, context: nil)
        
        view.addSubview(webView)
    }
    
    func setupProgressView() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.tintColor = UIColor(red: 1.0, green: 0.4, blue: 0.2, alpha: 1.0) // لون برتقالي
        view.addSubview(progressView)
        
        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 3)
        ])
    }
    
    func setupActivityIndicator() {
        activityIndicator = UIActivityIndicatorView(style: .large)
        activityIndicator.center = view.center
        activityIndicator.hidesWhenStopped = true
        activityIndicator.color = UIColor(red: 1.0, green: 0.4, blue: 0.2, alpha: 1.0)
        view.addSubview(activityIndicator)
    }
    
    func loadWebsite() {
        guard let url = URL(string: targetURL) else { return }
        let request = URLRequest(url: url, cachePolicy: .returnCacheDataElseLoad, timeoutInterval: 30)
        webView.load(request)
        activityIndicator.startAnimating()
    }
    
    override func observeValue(forKeyPath keyPath: String?, of object: Any?, change: [NSKeyValueChangeKey: Any]?, context: UnsafeMutableRawPointer?) {
        if keyPath == #keyPath(WKWebView.estimatedProgress) {
            progressView.progress = Float(webView.estimatedProgress)
            progressView.isHidden = webView.estimatedProgress >= 1.0
        }
    }
    
    deinit {
        webView.removeObserver(self, forKeyPath: #keyPath(WKWebView.estimatedProgress))
    }
}
