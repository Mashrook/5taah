import WebKit
import SafariServices

extension WebViewController: WKNavigationDelegate {
    
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        
        guard let url = navigationAction.request.url else {
            decisionHandler(.allow)
            return
        }
        
        let urlString = url.absoluteString
        
        // السماح بجميع روابط الموقع الأساسي
        if urlString.contains("5taah-production.up.railway.app") {
            decisionHandler(.allow)
            return
        }
        
        // فتح روابط الدفع الخارجية (مثل Moyasar, Stripe, etc.)
        let paymentDomains = ["moyasar.com", "checkout.stripe.com", "paypal.com", "apple.com/apple-pay"]
        for domain in paymentDomains {
            if urlString.contains(domain) {
                decisionHandler(.allow)
                return
            }
        }
        
        // فتح روابط mailto و tel بشكل طبيعي
        if url.scheme == "mailto" || url.scheme == "tel" {
            UIApplication.shared.open(url)
            decisionHandler(.cancel)
            return
        }
        
        // فتح الروابط الخارجية الأخرى في Safari
        if url.scheme == "https" || url.scheme == "http" {
            let safariVC = SFSafariViewController(url: url)
            present(safariVC, animated: true)
            decisionHandler(.cancel)
            return
        }
        
        decisionHandler(.allow)
    }
    
    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) {
        activityIndicator.stopAnimating()
        progressView.isHidden = true
    }
    
    func webView(_ webView: WKWebView, didFail navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        showErrorPage(error: error)
    }
    
    func webView(_ webView: WKWebView, didFailProvisionalNavigation navigation: WKNavigation!, withError error: Error) {
        activityIndicator.stopAnimating()
        
        // تجاهل خطأ إلغاء التحميل
        if (error as NSError).code == NSURLErrorCancelled { return }
        
        showErrorPage(error: error)
    }
    
    func showErrorPage(error: Error) {
        let html = """
        <html dir="rtl">
        <body style="font-family: Arial; text-align: center; padding: 50px; background: #f5f5f5;">
            <h2 style="color: #FF6633;">⚠️ تعذّر تحميل الصفحة</h2>
            <p style="color: #666;">\(error.localizedDescription)</p>
            <button onclick="window.location.reload()" 
                style="background: #FF6633; color: white; padding: 15px 30px; 
                       border: none; border-radius: 10px; font-size: 16px; cursor: pointer;">
                إعادة المحاولة
            </button>
        </body>
        </html>
        """
        webView.loadHTMLString(html, baseURL: nil)
    }
}
