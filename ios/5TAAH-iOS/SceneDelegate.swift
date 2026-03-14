import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        window = UIWindow(windowScene: windowScene)
        
        let webVC = WebViewController()
        let navController = UINavigationController(rootViewController: webVC)
        navController.setNavigationBarHidden(true, animated: false)
        
        window?.rootViewController = navController
        window?.makeKeyAndVisible()
    }
}
