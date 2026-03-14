import UIKit

class SplashViewController: UIViewController {

    private let bg: UIView = {
        let v = UIView()
        v.backgroundColor = AppConfig.Colors.splashBackground
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let logoView: UIImageView = {
        let iv = UIImageView()
        iv.image = UIImage(named: "AppLogo")
            ?? UIImage(systemName: "airplane.circle.fill")
        iv.tintColor   = .white
        iv.contentMode = .scaleAspectFit
        iv.alpha       = 0
        iv.translatesAutoresizingMaskIntoConstraints = false
        return iv
    }()

    private let nameLabel: UILabel = {
        let l = UILabel()
        l.text          = AppConfig.appName
        l.font          = UIFont.systemFont(ofSize: 52, weight: .bold)
        l.textColor     = AppConfig.Colors.splashText
        l.textAlignment = .center
        l.alpha         = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let line: UIView = {
        let v = UIView()
        v.backgroundColor    = UIColor.white.withAlphaComponent(0.5)
        v.layer.cornerRadius = 3
        v.alpha              = 0
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let subtitleLabel: UILabel = {
        let l = UILabel()
        l.text          = AppConfig.appSubtitle
        l.font          = UIFont.systemFont(ofSize: 17, weight: .regular)
        l.textColor     = UIColor.white.withAlphaComponent(0.85)
        l.textAlignment = .center
        l.alpha         = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let spinner: UIActivityIndicatorView = {
        let ai   = UIActivityIndicatorView(style: .large)
        ai.color = UIColor.white.withAlphaComponent(0.9)
        ai.alpha = 0
        ai.translatesAutoresizingMaskIntoConstraints = false
        return ai
    }()

    private let versionLabel: UILabel = {
        let l = UILabel()
        l.text          = "v\(AppConfig.appVersion)"
        l.font          = UIFont.systemFont(ofSize: 13, weight: .light)
        l.textColor     = UIColor.white.withAlphaComponent(0.5)
        l.textAlignment = .center
        l.alpha         = 0
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        animate()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .lightContent
    }

    private func setupUI() {
        [bg, logoView, nameLabel, line, subtitleLabel, spinner, versionLabel]
            .forEach { view.addSubview($0) }

        NSLayoutConstraint.activate([
            bg.topAnchor.constraint(equalTo: view.topAnchor),
            bg.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bg.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bg.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            logoView.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            logoView.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -90),
            logoView.widthAnchor.constraint(equalToConstant: AppConfig.Splash.logoSize),
            logoView.heightAnchor.constraint(equalToConstant: AppConfig.Splash.logoSize),

            nameLabel.topAnchor.constraint(equalTo: logoView.bottomAnchor, constant: 20),
            nameLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            line.topAnchor.constraint(equalTo: nameLabel.bottomAnchor, constant: 14),
            line.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            line.widthAnchor.constraint(equalToConstant: 50),
            line.heightAnchor.constraint(equalToConstant: 4),

            subtitleLabel.topAnchor.constraint(equalTo: line.bottomAnchor, constant: 14),
            subtitleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            spinner.bottomAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -50),
            spinner.centerXAnchor.constraint(equalTo: view.centerXAnchor),

            versionLabel.topAnchor.constraint(equalTo: spinner.bottomAnchor, constant: 10),
            versionLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }

    private func animate() {
        UIView.animate(withDuration: 0.5, delay: 0.2) {
            self.logoView.alpha = 1
        }
        UIView.animate(withDuration: 0.5, delay: 0.5) {
            self.nameLabel.alpha     = 1
            self.line.alpha          = 1
            self.subtitleLabel.alpha = 1
        }
        UIView.animate(withDuration: 0.4, delay: 0.9) {
            self.spinner.alpha      = 1
            self.versionLabel.alpha = 1
        } completion: { _ in
            self.spinner.startAnimating()
        }
        DispatchQueue.main.asyncAfter(deadline: .now() + AppConfig.Splash.duration) {
            self.goToMain()
        }
    }

    private func goToMain() {
        let nav = UINavigationController(rootViewController: MainWebViewController())
        nav.setNavigationBarHidden(true, animated: false)
        guard let window = view.window else { return }
        UIView.transition(with: window, duration: 0.45, options: .transitionCrossDissolve) {
            window.rootViewController = nav
        }
    }
}
