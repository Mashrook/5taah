import WebKit

extension WebViewController: WKUIDelegate {
    
    // دعم النوافذ المنبثقة (مطلوب لبعض بوابات الدفع)
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        
        if let url = navigationAction.request.url {
            webView.load(URLRequest(url: url))
        }
        return nil
    }
    
    // دعم Alert من JavaScript
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        let alert = UIAlertController(title: "تنبيه", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "حسناً", style: .default) { _ in completionHandler() })
        present(alert, animated: true)
    }
    
    // دعم Confirm من JavaScript
    func webView(_ webView: WKWebView, runJavaScriptConfirmPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping (Bool) -> Void) {
        let alert = UIAlertController(title: "تأكيد", message: message, preferredStyle: .alert)
        alert.addAction(UIAlertAction(title: "نعم", style: .default) { _ in completionHandler(true) })
        alert.addAction(UIAlertAction(title: "لا", style: .cancel) { _ in completionHandler(false) })
        present(alert, animated: true)
    }
}
