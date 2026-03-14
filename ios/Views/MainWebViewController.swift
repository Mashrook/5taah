import UIKit
import WebKit
import SafariServices

class MainWebViewController: UIViewController {

    private var webView: WKWebView!
    private var progressView: UIProgressView!
    private var progressObserver: NSKeyValueObservation?
    private var refreshControl: UIRefreshControl!

    private let loadingView: UIView = {
        let v = UIView()
        v.backgroundColor = AppConfig.Colors.background
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let loadingSpinner: UIActivityIndicatorView = {
        let ai = UIActivityIndicatorView(style: .large)
        ai.color = AppConfig.Colors.loadingIndicator
        ai.translatesAutoresizingMaskIntoConstraints = false
        return ai
    }()

    // MARK: - Lifecycle

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = AppConfig.Colors.background
        setupWebView()
        setupProgressBar()
        setupLoadingOverlay()
        setupPullToRefresh()
        loadWebsite()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle { .default }

    // MARK: - Setup

    private func setupWebView() {
        let config = WKWebViewConfiguration()
        config.allowsInlineMediaPlayback = AppConfig.WebView.allowInlineMediaPlayback
        config.mediaTypesRequiringUserActionForPlayback = AppConfig.WebView.mediaTypesRequiringUserAction

        let prefs = WKWebpagePreferences()
        prefs.allowsContentJavaScript = AppConfig.WebView.javaScriptEnabled
        config.defaultWebpagePreferences = prefs

        let ucc = WKUserContentController()
        ucc.add(self, name: "paymentHandler")
        config.userContentController = ucc

        webView = WKWebView(frame: .zero, configuration: config)
        webView.translatesAutoresizingMaskIntoConstraints = false
        webView.navigationDelegate = self
        webView.uiDelegate = self
        webView.allowsBackForwardNavigationGestures = AppConfig.Settings.swipeBackEnabled

        view.addSubview(webView)
        NSLayoutConstraint.activate([
            webView.topAnchor.constraint(equalTo: view.topAnchor),
            webView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            webView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            webView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
        ])
    }

    private func setupProgressBar() {
        progressView = UIProgressView(progressViewStyle: .default)
        progressView.translatesAutoresizingMaskIntoConstraints = false
        progressView.tintColor = AppConfig.Colors.progressBar
        progressView.isHidden = true
        view.addSubview(progressView)

        NSLayoutConstraint.activate([
            progressView.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            progressView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            progressView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            progressView.heightAnchor.constraint(equalToConstant: 3),
        ])

        progressObserver = webView.observe(\.estimatedProgress, options: .new) { [weak self] wv, _ in
            guard let self = self else { return }
            let prog = Float(wv.estimatedProgress)
            self.progressView.setProgress(prog, animated: true)
            self.progressView.isHidden = prog >= 1.0
        }
    }

    private func setupLoadingOverlay() {
        view.addSubview(loadingView)
        loadingView.addSubview(loadingSpinner)

        NSLayoutConstraint.activate([
            loadingView.topAnchor.constraint(equalTo: view.topAnchor),
            loadingView.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            loadingView.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            loadingView.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            loadingSpinner.centerXAnchor.constraint(equalTo: loadingView.centerXAnchor),
            loadingSpinner.centerYAnchor.constraint(equalTo: loadingView.centerYAnchor),
        ])
        loadingSpinner.startAnimating()
    }

    private func setupPullToRefresh() {
        guard AppConfig.Settings.pullToRefreshEnabled else { return }
        refreshControl = UIRefreshControl()
        refreshControl.tintColor = AppConfig.Colors.primary
        refreshControl.addTarget(self, action: #selector(pullRefresh), for: .valueChanged)
        webView.scrollView.refreshControl = refreshControl
    }

    // MARK: - Load

    private func loadWebsite() {
        guard let url = URL(string: AppConfig.websiteURL) else { return }
        let req = URLRequest(url: url,
                             cachePolicy: AppConfig.WebView.cachePolicy,
                             timeoutInterval: 30)
        webView.load(req)
    }

    @objc private func pullRefresh() {
        webView.reload()
    }

    private func hideLoading() {
        UIView.animate(withDuration: 0.3) {
            self.loadingView.alpha = 0
        } completion: { _ in
            self.loadingView.isHidden = true
            self.loadingSpinner.stopAnimating()
        }
        refreshControl?.endRefreshing()
    }

    private func showNoInternet(error: Error) {
        let vc = NoInternetViewController()
        vc.onRetry = { [weak self] in
            self?.dismiss(animated: true) {
                self?.loadingView.isHidden = false
                self?.loadingView.alpha = 1
                self?.loadingSpinner.startAnimating()
                self?.loadWebsite()
            }
        }
        vc.modalPresentationStyle = .fullScreen
        present(vc, animated: true)
    }

    deinit {
        progressObserver?.invalidate()
    }
}

// MARK: - WKNavigationDelegate

extension MainWebViewController: WKNavigationDelegate {

    func webView(_ webView: WKWebView,
                 decidePolicyFor navigationAction: WKNavigationAction,
                 decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow); return
        }
        let host = url.host ?? ""

        // Allow internal & whitelisted domains
        for domain in AppConfig.WebView.allowedDomains {
            if host.contains(domain) { decisionHandler(.allow); return }
        }

        // mailto / tel
        if url.scheme == "mailto" || url.scheme == "tel" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel); return
        }

        // External links in Safari
        if url.scheme == "https" || url.scheme == "http" {
            let safari = SFSafariViewController(url: url)
            present(safari, animated: true)
            decisionHandler(.cancel); return
        }

        decisionHandler(.allow)
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        hideLoading()
    }

    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        hideLoading()
    }

    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        if (error as NSError).code == NSURLErrorCancelled { return }
        hideLoading()
        showNoInternet(error: error)
    }
}

// MARK: - WKUIDelegate

extension MainWebViewController: WKUIDelegate {

    func webView(_ webView: WKWebView,
                 createWebViewWith configuration: WKWebViewConfiguration,
                 for navigationAction: WKNavigationAction,
                 windowFeatures: WKWindowFeatures) -> WKWebView? {
        if let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptAlertPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "\u{062D}\u{0633}\u{0646}\u{0627}\u{064B}", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }

    func webView(_ webView: WKWebView,
                 runJavaScriptConfirmPanelWithMessage message: String,
                 initiatedByFrame frame: WKFrameInfo,
                 completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: nil, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "\u{0646}\u{0639}\u{0645}", style: .default) { _ in completionHandler(true) })
        alert.addAction(UIAlertAction(title: "\u{0625}\u{0644}\u{063A}\u{0627}\u{0621}", style: .cancel) { _ in completionHandler(false) })
        present(alert, animated: true)
    }
}

// MARK: - WKScriptMessageHandler

extension MainWebViewController: WKScriptMessageHandler {

    func userContentController(_ userContentController: WKUserContentController,
                               didReceive message: WKScriptMessage) {
        guard message.name == "paymentHandler",
              let body = message.body as? [String: Any],
              let event = body["event"] as? String else { return }

        switch event {
        case "paymentSuccess":
            showAlert(title: "\u{2705} \u{062A}\u{0645} \u{0627}\u{0644}\u{062F}\u{0641}\u{0639} \u{0628}\u{0646}\u{062C}\u{0627}\u{062D}",
                      message: "\u{062A}\u{0645} \u{062A}\u{0623}\u{0643}\u{064A}\u{062F} \u{062D}\u{062C}\u{0632}\u{0643} \u{0628}\u{0646}\u{062C}\u{0627}\u{062D}")
        case "paymentFailed":
            let msg = body["message"] as? String ?? "\u{062D}\u{062F}\u{062B} \u{062E}\u{0637}\u{0623} \u{0641}\u{064A} \u{0639}\u{0645}\u{0644}\u{064A}\u{0629} \u{0627}\u{0644}\u{062F}\u{0641}\u{0639}"
            showAlert(title: "\u{274C} \u{0641}\u{0634}\u{0644} \u{0627}\u{0644}\u{062F}\u{0641}\u{0639}", message: msg)
        default:
            break
        }
    }

    private func showAlert(title: String, message: String) {
        let alert = UIAlertController(title: title, message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "\u{062D}\u{0633}\u{0646}\u{0627}\u{064B}", style: .default))
        present(alert, animated: true)
    }
}
