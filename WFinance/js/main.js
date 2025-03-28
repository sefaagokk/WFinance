document.addEventListener('DOMContentLoaded', () => {
    // Tema değiştirme
    const themeToggle = document.querySelector('.theme-toggle');
    themeToggle.addEventListener('click', toggleTheme);

    // Dil değiştirme
    const languageSelector = document.getElementById('language-selector');
    languageSelector.addEventListener('change', changeLanguage);

    // Cüzdan bağlantı
    const connectWalletBtn = document.getElementById('connect-wallet');
    connectWalletBtn.addEventListener('click', openWalletModal);

    // Modaller için kapatma butonları
    const closeModalButtons = document.querySelectorAll('.close-modal');
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeAllModals);
    });

    // Token seçim butonları
    const tokenSelectButtons = document.querySelectorAll('.token-select');
    tokenSelectButtons.forEach(button => {
        button.addEventListener('click', openTokenModal);
    });

    // Takas butonu
    const swapBtn = document.querySelector('.swap-btn');
    if (swapBtn) {
        swapBtn.addEventListener('click', performSwap);
    }

    // Token listesindeki token seçimleri
    const tokenItems = document.querySelectorAll('.token-item');
    tokenItems.forEach(item => {
        item.addEventListener('click', selectToken);
    });

    // Cüzdan seçenekleri
    const walletOptions = document.querySelectorAll('.wallet-option');
    walletOptions.forEach(option => {
        option.addEventListener('click', connectWallet);
    });

    // Stake butonları
    const stakeButtons = document.querySelectorAll('.stake-body .btn');
    stakeButtons.forEach(button => {
        button.addEventListener('click', performStake);
    });

    // Yardım sekmesindeki accordion
    const accordionHeaders = document.querySelectorAll('.accordion-header');
    accordionHeaders.forEach(header => {
        header.addEventListener('click', toggleAccordion);
    });

    // Destek formu
    const supportForm = document.getElementById('support-form');
    if (supportForm) {
        supportForm.addEventListener('submit', submitSupportForm);
    }

    // Web3 hazırlığı
    initWeb3();

    // Bildirimler Modalı
    const notificationsIcon = document.querySelector('.notifications-icon');
    const notificationsModal = document.querySelector('#notifications-modal');
    const closeNotificationsModal = notificationsModal.querySelector('.close-modal');

    notificationsIcon.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationsModal.classList.toggle('show');
    });

    closeNotificationsModal.addEventListener('click', () => {
        notificationsModal.classList.remove('show');
    });

    document.addEventListener('click', (e) => {
        if (!notificationsModal.contains(e.target) && !notificationsIcon.contains(e.target)) {
            notificationsModal.classList.remove('show');
        }
    });

    // Bildirimleri okundu olarak işaretle
    const notificationItems = document.querySelectorAll('.notification-item.unread');
    notificationItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.remove('unread');
            updateNotificationBadge();
        });
    });

    // Bildirim sayısını güncelle
    function updateNotificationBadge() {
        const unreadCount = document.querySelectorAll('.notification-item.unread').length;
        const badge = document.querySelector('.notification-badge');
        badge.textContent = unreadCount;
        if (unreadCount === 0) {
            badge.style.display = 'none';
        } else {
            badge.style.display = 'block';
        }
    }
});

// Tema değiştirme fonksiyonu
function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('.theme-toggle i');
    
    if (body.classList.contains('dark-theme')) {
        body.classList.remove('dark-theme');
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.add('dark-theme');
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
        localStorage.setItem('theme', 'dark');
    }
}

// Dil değiştirme fonksiyonu
function changeLanguage(e) {
    const language = e.target.value;
    localStorage.setItem('language', language);
    
    // Gerçek uygulamada burada çeviri API'si kullanılabilir
    // Şimdilik sadece bildirim gösteriyoruz
    showNotification('Dil değiştirildi', `Dil "${language === 'tr' ? 'Türkçe' : 'English'}" olarak ayarlandı.`, 'success');
}

// Modal açma/kapama fonksiyonları
function openWalletModal() {
    const modal = document.getElementById('wallet-modal');
    modal.classList.add('active');
}

function openTokenModal(e) {
    const modal = document.getElementById('token-modal');
    modal.classList.add('active');
    
    // Hangi input için token seçildiğini belirten veri
    const parentElement = e.currentTarget.closest('.swap-from, .swap-to');
    modal.dataset.for = parentElement.classList.contains('swap-from') ? 'from' : 'to';
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('active');
    });
}

// Token seçme
function selectToken(e) {
    const tokenItem = e.currentTarget;
    const symbol = tokenItem.dataset.symbol;
    const tokenName = tokenItem.querySelector('.token-info p').textContent;
    const modal = document.getElementById('token-modal');
    
    // Hangi input için token seçildiğini al
    const forInput = modal.dataset.for;
    const buttonSelector = forInput === 'from' ? '.swap-from .token-select .token-name' : '.swap-to .token-select .token-name';
    
    const tokenNameElement = document.querySelector(buttonSelector);
    if (tokenNameElement) {
        tokenNameElement.textContent = symbol;
    }
    
    // Modali kapat
    closeAllModals();
    
    // Rates güncelle (gerçek uygulamada API ile fiyat alınır)
    updateExchangeRate();
}

// Takas fonksiyonu
function performSwap() {
    // Web3 bağlantısını kontrol et
    if (!window.web3Connected) {
        showNotification('Bağlantı Gerekli', 'Takas işlemi için cüzdanınızı bağlamanız gerekmektedir.', 'warning');
        return;
    }
    
    const fromTokenElement = document.querySelector('.swap-from .token-select .token-name');
    const toTokenElement = document.querySelector('.swap-to .token-select .token-name');
    
    if (fromTokenElement.textContent === 'Seçin' || toTokenElement.textContent === 'Seçin') {
        showNotification('Token Seçimi', 'Lütfen takas etmek istediğiniz tokenleri seçin.', 'warning');
        return;
    }
    
    const fromAmount = document.querySelector('.swap-from input').value;
    
    if (!fromAmount || fromAmount <= 0) {
        showNotification('Geçersiz Miktar', 'Lütfen geçerli bir miktar girin.', 'warning');
        return;
    }
    
    // Simülasyon: Gerçek uygulamada burada Web3 işlemleri yapılır
    showNotification('İşlem Gönderildi', 'Takas işleminiz blok zincirinde işleniyor...', 'success');
    
    // İşlem geçmişine ekle
    addToTransactionHistory('Takas', `${fromAmount} ${fromTokenElement.textContent} -> ${toTokenElement.textContent}`, 'İşleniyor');
    
    // 3 saniye sonra işlemin tamamlandığını simüle et
    setTimeout(() => {
        showNotification('İşlem Başarılı', 'Takas işleminiz başarıyla tamamlandı.', 'success');
        updateTransactionStatus(`${fromAmount} ${fromTokenElement.textContent} -> ${toTokenElement.textContent}`, 'Tamamlandı');
    }, 3000);
}

// Cüzdan bağlama fonksiyonu
function connectWallet(e) {
    const walletType = e.currentTarget.dataset.wallet;
    
    // Simülasyon: Gerçek uygulamada burada Web3 provider ile bağlantı yapılır
    showNotification('Bağlanıyor', `${walletType} cüzdanınız bağlanıyor...`, 'info');
    
    // Modalı kapat
    closeAllModals();
    
    // 2 saniye sonra bağlantının başarılı olduğunu simüle et
    setTimeout(() => {
        window.web3Connected = true;
        
        // Cüzdan butonu güncelleme
        const connectWalletBtn = document.getElementById('connect-wallet');
        connectWalletBtn.textContent = '0x1234...5678';
        
        showNotification('Bağlantı Başarılı', 'Cüzdanınız başarıyla bağlandı.', 'success');
        
        // Portföy ve işlem geçmişi verilerini yükle
        loadPortfolio();
        loadTransactionHistory();
    }, 2000);
}

// Stake işlemi
function performStake(e) {
    // Web3 bağlantısını kontrol et
    if (!window.web3Connected) {
        showNotification('Bağlantı Gerekli', 'Stake işlemi için cüzdanınızı bağlamanız gerekmektedir.', 'warning');
        return;
    }
    
    const stakeCard = e.currentTarget.closest('.stake-card');
    const tokenName = stakeCard.querySelector('h3').textContent.split(' ')[0];
    const amount = stakeCard.querySelector('input').value;
    
    if (!amount || amount <= 0) {
        showNotification('Geçersiz Miktar', 'Lütfen geçerli bir miktar girin.', 'warning');
        return;
    }
    
    // Stake minimum kontrolü
    const minStakeText = stakeCard.querySelector('.stake-body p:first-child').textContent;
    const minStake = parseFloat(minStakeText.match(/[\d.]+/)[0]);
    
    if (amount < minStake) {
        showNotification('Yetersiz Miktar', `Minimum stake miktarı ${minStake} ${tokenName} olmalıdır.`, 'warning');
        return;
    }
    
    // Simülasyon: Gerçek uygulamada burada Web3 işlemleri yapılır
    showNotification('İşlem Gönderildi', 'Stake işleminiz blok zincirinde işleniyor...', 'success');
    
    // İşlem geçmişine ekle
    addToTransactionHistory('Stake', `${amount} ${tokenName}`, 'İşleniyor');
    
    // 3 saniye sonra işlemin tamamlandığını simüle et
    setTimeout(() => {
        showNotification('İşlem Başarılı', 'Stake işleminiz başarıyla tamamlandı.', 'success');
        updateTransactionStatus(`${amount} ${tokenName}`, 'Tamamlandı');
    }, 3000);
}

// Accordion kontrolü
function toggleAccordion(e) {
    const accordionItem = e.currentTarget.parentElement;
    
    // Diğer tüm accordion itemları kapat
    const allItems = document.querySelectorAll('.accordion-item');
    allItems.forEach(item => {
        if (item !== accordionItem) {
            item.classList.remove('active');
        }
    });
    
    // Tıklanan item'ı aç/kapa
    accordionItem.classList.toggle('active');
}

// Destek formu gönderimi
function submitSupportForm(e) {
    e.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const message = document.getElementById('message').value;
    
    // Simülasyon: Gerçek uygulamada API'ye gönderilir
    showNotification('Form Gönderildi', 'Destek talebiniz başarıyla gönderildi. En kısa sürede size dönüş yapacağız.', 'success');
    
    // Formu temizle
    e.target.reset();
}

// Bildirim gösterme
function showNotification(title, message, type = 'info') {
    const notificationContainer = document.querySelector('.notification-container');
    
    // Bildirim elementi oluştur
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icon = getNotificationIcon(type);
    
    notification.innerHTML = `
        <div class="icon"><i class="${icon}"></i></div>
        <div class="notification-content">
            <div class="title">${title}</div>
            <div class="message">${message}</div>
        </div>
        <div class="close"><i class="fas fa-times"></i></div>
    `;
    
    // Bildirim kapatma butonu
    notification.querySelector('.close').addEventListener('click', () => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    });
    
    // Bildirim container'a ekle
    notificationContainer.appendChild(notification);
    
    // Animasyon için timeout
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Otomatik kapanma
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 5000);
}

// Bildirim tipine göre ikon
function getNotificationIcon(type) {
    switch (type) {
        case 'success':
            return 'fas fa-check-circle';
        case 'warning':
            return 'fas fa-exclamation-triangle';
        case 'error':
            return 'fas fa-times-circle';
        default:
            return 'fas fa-info-circle';
    }
}

// Exchange rate güncelleme
function updateExchangeRate() {
    const fromToken = document.querySelector('.swap-from .token-select .token-name').textContent;
    const toToken = document.querySelector('.swap-to .token-select .token-name').textContent;
    
    if (fromToken === 'Seçin' || toToken === 'Seçin') {
        return;
    }
    
    const rateText = document.querySelector('.swap-details p:first-child');
    
    // Simülasyon: Gerçek uygulamada API'den anlık kur bilgisi alınır
    let rate;
    if (fromToken === 'ETH' && toToken === 'USDT') {
        rate = '1 ETH = 1700 USDT';
    } else if (fromToken === 'USDT' && toToken === 'ETH') {
        rate = '1700 USDT = 1 ETH';
    } else if (fromToken === 'BTC' && toToken === 'ETH') {
        rate = '1 BTC = 15 ETH';
    } else if (fromToken === 'ETH' && toToken === 'BTC') {
        rate = '15 ETH = 1 BTC';
    } else if (fromToken === 'BTC' && toToken === 'USDT') {
        rate = '1 BTC = 25500 USDT';
    } else if (fromToken === 'USDT' && toToken === 'BTC') {
        rate = '25500 USDT = 1 BTC';
    }
    
    if (rate && rateText) {
        rateText.textContent = rate;
    }
}

// Portföy yükleme
function loadPortfolio() {
    const valueElement = document.querySelector('.total-value .value');
    const assetsList = document.querySelector('.assets-list');
    
    // Simülasyon: Gerçek uygulamada cüzdandan veri çekilir
    const mockPortfolio = {
        totalValue: '5,248.32',
        assets: [
            { name: 'Ethereum', symbol: 'ETH', amount: '2.5', value: '4,250.00' },
            { name: 'Tether', symbol: 'USDT', amount: '500', value: '500.00' },
            { name: 'Bitcoin', symbol: 'BTC', amount: '0.02', value: '498.32' }
        ]
    };
    
    // Toplam değeri güncelle
    if (valueElement) {
        valueElement.textContent = `$${mockPortfolio.totalValue}`;
    }
    
    // Varlıkları listele
    if (assetsList) {
        // "No assets" mesajını temizle
        assetsList.innerHTML = '';
        
        mockPortfolio.assets.forEach(asset => {
            const assetItem = document.createElement('div');
            assetItem.className = 'asset-item';
            assetItem.innerHTML = `
                <div class="asset-info">
                    <h4>${asset.name} (${asset.symbol})</h4>
                    <p class="amount">${asset.amount} ${asset.symbol}</p>
                </div>
                <div class="asset-value">$${asset.value}</div>
            `;
            assetsList.appendChild(assetItem);
        });
    }
}

// İşlem geçmişi yükleme
function loadTransactionHistory() {
    const tbody = document.querySelector('.transaction-history table tbody');
    
    if (!tbody) return;
    
    // "No transactions" mesajını temizle
    tbody.innerHTML = '';
    
    // Simülasyon: Gerçek uygulamada blok zincirinden işlem geçmişi çekilir
    const mockTransactions = [
        { date: '15.03.2023 14:32', type: 'Takas', amount: '0.5 ETH -> 850 USDT', status: 'Tamamlandı' },
        { date: '14.03.2023 09:15', type: 'Stake', amount: '200 USDT', status: 'Tamamlandı' },
        { date: '10.03.2023 18:45', type: 'Transfer', amount: '0.1 BTC -> 0xa1b2...c3d4', status: 'Tamamlandı' }
    ];
    
    mockTransactions.forEach(tx => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${tx.date}</td>
            <td>${tx.type}</td>
            <td>${tx.amount}</td>
            <td>${tx.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

// İşlem geçmişine yeni işlem ekleme
function addToTransactionHistory(type, amount, status) {
    const tbody = document.querySelector('.transaction-history table tbody');
    
    if (!tbody) return;
    
    // "No transactions" mesajını temizle
    if (tbody.querySelector('.no-transactions')) {
        tbody.innerHTML = '';
    }
    
    // Tarih oluştur
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')}.${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // Yeni satır ekle
    const tr = document.createElement('tr');
    tr.dataset.amount = amount; // Status güncellemesi için kullanılacak
    tr.innerHTML = `
        <td>${date}</td>
        <td>${type}</td>
        <td>${amount}</td>
        <td>${status}</td>
    `;
    
    // En üste ekle
    if (tbody.firstChild) {
        tbody.insertBefore(tr, tbody.firstChild);
    } else {
        tbody.appendChild(tr);
    }
}

// İşlem durumu güncelleme
function updateTransactionStatus(amount, newStatus) {
    const tbody = document.querySelector('.transaction-history table tbody');
    
    if (!tbody) return;
    
    // Eşleşen işlemi bul
    const tr = Array.from(tbody.querySelectorAll('tr')).find(row => row.dataset.amount === amount);
    
    if (tr) {
        // Durum hücresini güncelle
        const statusCell = tr.querySelector('td:last-child');
        if (statusCell) {
            statusCell.textContent = newStatus;
        }
    }
}

// Web3 başlatma
function initWeb3() {
    // Web3 bağlantı durumu
    window.web3Connected = false;
    
    // Tema ve dil ayarlarını localStorage'dan yükle
    loadThemePreference();
    loadLanguagePreference();
    
    // Cüzdan bağlı mı kontrol et ve otomatik bağlan
    checkCachedWalletConnection();
}

// Tema ayarlarını yükle
function loadThemePreference() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        const icon = document.querySelector('.theme-toggle i');
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }
}

// Dil ayarlarını yükle
function loadLanguagePreference() {
    const savedLanguage = localStorage.getItem('language');
    
    if (savedLanguage) {
        const languageSelector = document.getElementById('language-selector');
        if (languageSelector) {
            languageSelector.value = savedLanguage;
        }
    }
}

// Kaydedilmiş cüzdan bağlantısını kontrol et
function checkCachedWalletConnection() {
    // Gerçek uygulamada burada localStorage veya çerezlerde kaydedilmiş cüzdan bağlantısı kontrol edilir
    // Şimdilik simülasyon yapıyoruz
    const hasCachedConnection = false;
    
    if (hasCachedConnection) {
        // Otomatik bağlan
        window.web3Connected = true;
        
        // Cüzdan butonu güncelleme
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            connectWalletBtn.textContent = '0x1234...5678';
        }
        
        // Verileri yükle
        loadPortfolio();
        loadTransactionHistory();
    }
} 