import UIKit

class NoInternetViewController: UIViewController {

    var onRetry: (() -> Void)?

    private let bg: UIView = {
        let v = UIView()
        v.backgroundColor = AppConfig.Colors.background
        v.translatesAutoresizingMaskIntoConstraints = false
        return v
    }()

    private let iconLabel: UILabel = {
        let l = UILabel()
        l.text          = "📡"
        l.font          = UIFont.systemFont(ofSize: 70)
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let titleLabel: UILabel = {
        let l = UILabel()
        l.text          = "لا يوجد اتصال بالإنترنت"
        l.font          = UIFont.systemFont(ofSize: 22, weight: .bold)
        l.textColor     = AppConfig.Colors.textPrimary
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private let subtitleLabel: UILabel = {
        let l = UILabel()
        l.text          = "تحقق من اتصالك بالإنترنت\nثم حاول مرة أخرى"
        l.font          = UIFont.systemFont(ofSize: 15, weight: .regular)
        l.textColor     = AppConfig.Colors.textSecondary
        l.textAlignment = .center
        l.numberOfLines = 2
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    private lazy var retryButton: UIButton = {
        let b = UIButton(type: .system)
        b.setTitle("إعادة المحاولة", for: .normal)
        b.setTitleColor(.white, for: .normal)
        b.backgroundColor       = AppConfig.Colors.primary
        b.titleLabel?.font      = UIFont.systemFont(ofSize: 16, weight: .semibold)
        b.layer.cornerRadius    = 14
        b.layer.masksToBounds   = true
        b.contentEdgeInsets     = UIEdgeInsets(top: 14, left: 36, bottom: 14, right: 36)
        b.addTarget(self, action: #selector(retryTapped), for: .touchUpInside)
        b.translatesAutoresizingMaskIntoConstraints = false
        return b
    }()

    private let appNameLabel: UILabel = {
        let l = UILabel()
        l.text          = AppConfig.appName
        l.font          = UIFont.systemFont(ofSize: 13, weight: .light)
        l.textColor     = AppConfig.Colors.textSecondary.withAlphaComponent(0.5)
        l.textAlignment = .center
        l.translatesAutoresizingMaskIntoConstraints = false
        return l
    }()

    override func viewDidLoad() {
        super.viewDidLoad()
        setupUI()
    }

    override var preferredStatusBarStyle: UIStatusBarStyle {
        return .darkContent
    }

    private func setupUI() {
        [bg, iconLabel, titleLabel, subtitleLabel, retryButton, appNameLabel]
            .forEach { view.addSubview($0) }

        NSLayoutConstraint.activate([
            bg.topAnchor.constraint(equalTo: view.topAnchor),
            bg.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            bg.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            bg.bottomAnchor.constraint(equalTo: view.bottomAnchor),

            iconLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            iconLabel.centerYAnchor.constraint(equalTo: view.centerYAnchor, constant: -100),

            titleLabel.topAnchor.constraint(equalTo: iconLabel.bottomAnchor, constant: 20),
            titleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            titleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            titleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),

            subtitleLabel.topAnchor.constraint(equalTo: titleLabel.bottomAnchor, constant: 12),
            subtitleLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            subtitleLabel.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 32),
            subtitleLabel.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -32),

            retryButton.topAnchor.constraint(equalTo: subtitleLabel.bottomAnchor, constant: 36),
            retryButton.centerXAnchor.constraint(equalTo: view.centerXAnchor),
            retryButton.heightAnchor.constraint(equalToConstant: 52),

            appNameLabel.bottomAnchor.constraint(
                equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -20),
            appNameLabel.centerXAnchor.constraint(equalTo: view.centerXAnchor),
        ])
    }

    @objc private func retryTapped() {
        UIView.animate(withDuration: 0.1, animations: {
            self.retryButton.transform = CGAffineTransform(scaleX: 0.95, y: 0.95)
        }) { _ in
            UIView.animate(withDuration: 0.1) {
                self.retryButton.transform = .identity
            }
        }
        dismiss(animated: false) {
            self.onRetry?()
        }
    }
}
