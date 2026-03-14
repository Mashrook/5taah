import WebKit

extension WebViewController: WKScriptMessageHandler {
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        if message.name == "paymentHandler" {
            guard let body = message.body as? [String: Any] else { return }
            
            let event = body["event"] as? String ?? ""
            
            switch event {
            case "paymentSuccess":
                handlePaymentSuccess(data: body)
            case "paymentFailed":
                handlePaymentFailed(data: body)
            case "bookingComplete":
                handleBookingComplete(data: body)
            default:
                break
            }
        }
    }
    
    func handlePaymentSuccess(data: [String: Any]) {
        DispatchQueue.main.async {
            let alert = UIAlertController(
                title: "✅ تم الدفع بنجاح",
                message: "تم تأكيد حجزك بنجاح",
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "حسناً", style: .default))
            self.present(alert, animated: true)
        }
    }
    
    func handlePaymentFailed(data: [String: Any]) {
        DispatchQueue.main.async {
            let errorMsg = data["message"] as? String ?? "حدث خطأ في عملية الدفع"
            let alert = UIAlertController(
                title: "❌ فشل الدفع",
                message: errorMsg,
                preferredStyle: .alert
            )
            alert.addAction(UIAlertAction(title: "إعادة المحاولة", style: .default))
            self.present(alert, animated: true)
        }
    }
    
    func handleBookingComplete(data: [String: Any]) {
        // يمكن إضافة إشعار محلي هنا
        print("Booking completed: \(data)")
    }
}
