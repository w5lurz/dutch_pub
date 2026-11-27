// The server's own texts in the app's languages: push notifications, the password reset email and
// page, and the account deletion page. (The privacy policy stays English. API answers stay
// English too: the app translates them, see mobile/src/i18n/serverMessages.ts.)
// {name}-style parts are filled in by `text`.

export const LANGUAGES = ['en', 'hu', 'de', 'fr', 'uk', 'zh'];

const TEXTS = {
    en: {
        pushYourTurn: 'Your turn',
        pushCalledYou: '{name} called you!',
        pushLayCard: 'Lay a card in {room}.',
        pushLayMagic: 'Lay a magic card or pick up the pile ({room}).',
        mailSubject: 'Set a new Dutch Pub password',
        mailGreeting: 'Hi {name},',
        mailIntro: 'Someone (hopefully you) asked to set a new password for your Dutch Pub account. Open this link within {minutes} minutes:',
        mailButton: 'Set a new password',
        mailIgnore: "If it wasn't you, ignore this email: your password stays as it is.",
        resetTitle: 'Set a new Dutch Pub password',
        resetHeading: 'Set a new password',
        resetPassword: 'New password',
        resetAgain: 'New password again',
        resetSave: 'Save the new password',
        resetExpired: 'This link has expired or was already used. Ask for a new one in the app: Log in → Forgot password?',
        resetDone: 'Your password has been changed. Open Dutch Pub and log in with it.',
        passwordsDiffer: 'The two passwords are not the same.',
        passwordShort: 'The password needs at least {min} characters.',
        passwordLong: 'The password is too long.',
        deleteTitle: 'Delete your Dutch Pub account',
        deleteText:
            'This deletes your account, avatar, sign-in and notification tokens. In past played games your name becomes “[deleted]”, so the other players keep their results. This cannot be undone.',
        deleteHint:
            'You can also do this in the app: Account tab → Delete account. Guests have no account: their name is freed when they log out or their session runs out.',
        username: 'Username',
        password: 'Password',
        deleteButton: 'Delete my account',
        deleted: 'Your account has been deleted.',
        wrongLogin: 'Wrong username or password.',
        deleteInGame: 'You are in a running game. You can delete your account once it is over.',
        deleteLeaveRoom: 'Leave the room "{room}" first, then delete your account.',
        tooMany: 'Too many attempts. Please wait a few minutes and try again.',
        somethingWrong: 'Something went wrong. Please try again later.',
        privacy: 'Privacy policy',
    },
    hu: {
        pushYourTurn: 'Te jössz',
        pushCalledYou: '{name} téged hívott!',
        pushLayCard: 'Rakj le egy lapot itt: {room}.',
        pushLayMagic: 'Rakj varázslapot, vagy vedd fel a kirakott lapokat ({room}).',
        mailSubject: 'Új Dutch Pub-jelszó beállítása',
        mailGreeting: 'Szia {name}!',
        mailIntro: 'Valaki (remélhetőleg te) új jelszót kért a Dutch Pub-fiókodhoz. Nyisd meg ezt a linket {minutes} percen belül:',
        mailButton: 'Új jelszó beállítása',
        mailIgnore: 'Ha nem te voltál, hagyd figyelmen kívül ezt az e-mailt: a jelszavad nem változik.',
        resetTitle: 'Új Dutch Pub-jelszó beállítása',
        resetHeading: 'Új jelszó beállítása',
        resetPassword: 'Új jelszó',
        resetAgain: 'Új jelszó még egyszer',
        resetSave: 'Új jelszó mentése',
        resetExpired: 'Ez a link lejárt vagy már felhasználták. Kérj újat az alkalmazásban: Bejelentkezés → Elfelejtetted a jelszavad?',
        resetDone: 'A jelszavad megváltozott. Nyisd meg a Dutch Pubot, és jelentkezz be vele.',
        passwordsDiffer: 'A két jelszó nem egyezik.',
        passwordShort: 'A jelszónak legalább {min} karakteresnek kell lennie.',
        passwordLong: 'A jelszó túl hosszú.',
        deleteTitle: 'Dutch Pub-fiók törlése',
        deleteText:
            'Ezzel törlődik a fiókod, az avatarod, a bejelentkezési és értesítési tokenjeid. A korábbi játékokban a neved helyén „[deleted]” áll, így a többiek eredményei megmaradnak. Ez nem vonható vissza.',
        deleteHint:
            'Ezt az alkalmazásban is megteheted: Fiók fül → Fiók törlése. A vendégeknek nincs fiókjuk: a nevük felszabadul, amikor kijelentkeznek vagy lejár a munkamenetük.',
        username: 'Felhasználónév',
        password: 'Jelszó',
        deleteButton: 'Fiókom törlése',
        deleted: 'A fiókodat töröltük.',
        wrongLogin: 'Hibás felhasználónév vagy jelszó.',
        deleteInGame: 'Épp játékban vagy. A fiókodat a játék végeztével törölheted.',
        deleteLeaveRoom: 'Előbb lépj ki a(z) „{room}” szobából, aztán töröld a fiókodat.',
        tooMany: 'Túl sok próbálkozás. Várj pár percet, és próbáld újra.',
        somethingWrong: 'Valami hiba történt. Próbáld újra később.',
        privacy: 'Adatvédelmi tájékoztató (angolul)',
    },
    de: {
        pushYourTurn: 'Du bist dran',
        pushCalledYou: '{name} hat dich aufgerufen!',
        pushLayCard: 'Leg eine Karte in {room}.',
        pushLayMagic: 'Leg eine Zauberkarte oder nimm den Stapel auf ({room}).',
        mailSubject: 'Neues Passwort für Dutch Pub festlegen',
        mailGreeting: 'Hallo {name},',
        mailIntro: 'Jemand (hoffentlich du) möchte ein neues Passwort für dein Dutch-Pub-Konto festlegen. Öffne diesen Link innerhalb von {minutes} Minuten:',
        mailButton: 'Neues Passwort festlegen',
        mailIgnore: 'Wenn du es nicht warst, ignoriere diese E-Mail: Dein Passwort bleibt, wie es ist.',
        resetTitle: 'Neues Passwort für Dutch Pub festlegen',
        resetHeading: 'Neues Passwort festlegen',
        resetPassword: 'Neues Passwort',
        resetAgain: 'Neues Passwort wiederholen',
        resetSave: 'Neues Passwort speichern',
        resetExpired: 'Dieser Link ist abgelaufen oder wurde schon benutzt. Fordere in der App einen neuen an: Anmelden → Passwort vergessen?',
        resetDone: 'Dein Passwort wurde geändert. Öffne Dutch Pub und melde dich damit an.',
        passwordsDiffer: 'Die beiden Passwörter sind nicht gleich.',
        passwordShort: 'Das Passwort braucht mindestens {min} Zeichen.',
        passwordLong: 'Das Passwort ist zu lang.',
        deleteTitle: 'Dutch-Pub-Konto löschen',
        deleteText:
            'Damit werden dein Konto, dein Avatar sowie deine Anmelde- und Benachrichtigungs-Tokens gelöscht. In vergangenen Spielen wird dein Name zu „[deleted]“, damit die anderen ihre Ergebnisse behalten. Das lässt sich nicht rückgängig machen.',
        deleteHint:
            'Das geht auch in der App: Tab „Konto“ → Konto löschen. Gäste haben kein Konto: Ihr Name wird frei, wenn sie sich abmelden oder ihre Sitzung abläuft.',
        username: 'Benutzername',
        password: 'Passwort',
        deleteButton: 'Mein Konto löschen',
        deleted: 'Dein Konto wurde gelöscht.',
        wrongLogin: 'Falscher Benutzername oder falsches Passwort.',
        deleteInGame: 'Du bist in einem laufenden Spiel. Du kannst dein Konto löschen, sobald es vorbei ist.',
        deleteLeaveRoom: 'Verlass zuerst den Raum „{room}“ und lösche dann dein Konto.',
        tooMany: 'Zu viele Versuche. Bitte warte ein paar Minuten und versuch es erneut.',
        somethingWrong: 'Etwas ist schiefgelaufen. Bitte versuch es später erneut.',
        privacy: 'Datenschutzerklärung (Englisch)',
    },
    fr: {
        pushYourTurn: 'À toi de jouer',
        pushCalledYou: '{name} t’a appelé !',
        pushLayCard: 'Pose une carte dans {room}.',
        pushLayMagic: 'Pose une carte magique ou ramasse la pile ({room}).',
        mailSubject: 'Choisir un nouveau mot de passe Dutch Pub',
        mailGreeting: 'Bonjour {name},',
        mailIntro: 'Quelqu’un (toi, espérons-le) a demandé un nouveau mot de passe pour ton compte Dutch Pub. Ouvre ce lien dans les {minutes} minutes :',
        mailButton: 'Choisir un nouveau mot de passe',
        mailIgnore: 'Si ce n’était pas toi, ignore cet e-mail : ton mot de passe ne change pas.',
        resetTitle: 'Choisir un nouveau mot de passe Dutch Pub',
        resetHeading: 'Choisir un nouveau mot de passe',
        resetPassword: 'Nouveau mot de passe',
        resetAgain: 'Nouveau mot de passe, encore',
        resetSave: 'Enregistrer le nouveau mot de passe',
        resetExpired: 'Ce lien a expiré ou a déjà servi. Demandes-en un nouveau dans l’appli : Se connecter → Mot de passe oublié ?',
        resetDone: 'Ton mot de passe a été changé. Ouvre Dutch Pub et connecte-toi avec.',
        passwordsDiffer: 'Les deux mots de passe ne sont pas identiques.',
        passwordShort: 'Le mot de passe doit faire au moins {min} caractères.',
        passwordLong: 'Le mot de passe est trop long.',
        deleteTitle: 'Supprimer ton compte Dutch Pub',
        deleteText:
            'Cela supprime ton compte, ton avatar et tes jetons de connexion et de notification. Dans les parties passées, ton nom devient « [deleted] », pour que les autres gardent leurs résultats. C’est irréversible.',
        deleteHint:
            'Tu peux aussi le faire dans l’appli : onglet Compte → Supprimer le compte. Les invités n’ont pas de compte : leur nom est libéré quand ils se déconnectent ou que leur session expire.',
        username: 'Nom d’utilisateur',
        password: 'Mot de passe',
        deleteButton: 'Supprimer mon compte',
        deleted: 'Ton compte a été supprimé.',
        wrongLogin: 'Nom d’utilisateur ou mot de passe incorrect.',
        deleteInGame: 'Tu es dans une partie en cours. Tu pourras supprimer ton compte une fois terminée.',
        deleteLeaveRoom: 'Quitte d’abord la salle « {room} », puis supprime ton compte.',
        tooMany: 'Trop de tentatives. Attends quelques minutes et réessaie.',
        somethingWrong: 'Un problème est survenu. Réessaie plus tard.',
        privacy: 'Politique de confidentialité (en anglais)',
    },
    uk: {
        pushYourTurn: 'Твій хід',
        pushCalledYou: '{name} викликав тебе!',
        pushLayCard: 'Поклади карту в кімнаті {room}.',
        pushLayMagic: 'Поклади магічну карту або забери стос ({room}).',
        mailSubject: 'Новий пароль для Dutch Pub',
        mailGreeting: 'Привіт, {name}!',
        mailIntro: 'Хтось (сподіваємося, ти) попросив новий пароль для твого профілю Dutch Pub. Відкрий це посилання протягом {minutes} хвилин:',
        mailButton: 'Задати новий пароль',
        mailIgnore: 'Якщо це був не ти, просто проігноруй цей лист: твій пароль не зміниться.',
        resetTitle: 'Новий пароль для Dutch Pub',
        resetHeading: 'Задати новий пароль',
        resetPassword: 'Новий пароль',
        resetAgain: 'Новий пароль ще раз',
        resetSave: 'Зберегти новий пароль',
        resetExpired: 'Посилання застаріло або вже використане. Попроси нове в застосунку: Вхід → Забув пароль?',
        resetDone: 'Твій пароль змінено. Відкрий Dutch Pub і увійди з ним.',
        passwordsDiffer: 'Паролі не однакові.',
        passwordShort: 'Пароль має містити щонайменше {min} символів.',
        passwordLong: 'Пароль задовгий.',
        deleteTitle: 'Видалити профіль Dutch Pub',
        deleteText:
            'Це видалить твій профіль, аватар, токени входу й сповіщень. У минулих іграх твоє імʼя стане «[deleted]», щоб інші зберегли свої результати. Це не можна скасувати.',
        deleteHint:
            'Це можна зробити й у застосунку: вкладка «Профіль» → Видалити профіль. У гостей немає профілю: їхнє імʼя звільняється, коли вони виходять або закінчується сесія.',
        username: 'Імʼя користувача',
        password: 'Пароль',
        deleteButton: 'Видалити мій профіль',
        deleted: 'Твій профіль видалено.',
        wrongLogin: 'Неправильне імʼя користувача або пароль.',
        deleteInGame: 'Ти в грі, що триває. Видалити профіль можна, коли вона закінчиться.',
        deleteLeaveRoom: 'Спершу вийди з кімнати «{room}», а потім видали профіль.',
        tooMany: 'Забагато спроб. Зачекай кілька хвилин і спробуй знову.',
        somethingWrong: 'Щось пішло не так. Спробуй пізніше.',
        privacy: 'Політика конфіденційності (англійською)',
    },
    zh: {
        pushYourTurn: '轮到你了',
        pushCalledYou: '{name} 点名了你！',
        pushLayCard: '在 {room} 出一张牌。',
        pushLayMagic: '出一张魔法牌或者收起出牌区的牌（{room}）。',
        mailSubject: '设置新的 Dutch Pub 密码',
        mailGreeting: '{name}，你好：',
        mailIntro: '有人（希望是你）申请为你的 Dutch Pub 账户设置新密码。请在 {minutes} 分钟内打开此链接：',
        mailButton: '设置新密码',
        mailIgnore: '如果不是你本人操作，请忽略此邮件：你的密码不会改变。',
        resetTitle: '设置新的 Dutch Pub 密码',
        resetHeading: '设置新密码',
        resetPassword: '新密码',
        resetAgain: '再次输入新密码',
        resetSave: '保存新密码',
        resetExpired: '此链接已过期或已被使用。请在应用中重新申请：登录 → 忘记密码？',
        resetDone: '你的密码已更改。打开 Dutch Pub 并用新密码登录。',
        passwordsDiffer: '两次输入的密码不一致。',
        passwordShort: '密码至少需要 {min} 个字符。',
        passwordLong: '密码太长了。',
        deleteTitle: '删除你的 Dutch Pub 账户',
        deleteText: '这将删除你的账户、头像以及登录和通知令牌。在过去的对局中，你的名字会显示为“[deleted]”，以便其他玩家保留成绩。此操作无法撤销。',
        deleteHint: '你也可以在应用中操作：“账户”标签页 → 删除账户。游客没有账户：退出登录或会话过期后，名字就会被释放。',
        username: '用户名',
        password: '密码',
        deleteButton: '删除我的账户',
        deleted: '你的账户已删除。',
        wrongLogin: '用户名或密码错误。',
        deleteInGame: '你正在进行游戏。游戏结束后才能删除账户。',
        deleteLeaveRoom: '请先离开房间“{room}”，然后再删除账户。',
        tooMany: '尝试次数过多，请等几分钟后再试。',
        somethingWrong: '出了点问题，请稍后再试。',
        privacy: '隐私政策（英文）',
    },
};

/** `value` ("hu", "hu-HU", ...) as one of the languages, else English. */
export const languageOf = value => {
    const code = typeof value === 'string' ? value.trim().slice(0, 2).toLowerCase() : '';
    return LANGUAGES.includes(code) ? code : 'en';
};

/** The best of the languages for an `Accept-Language` header (the browser's choice), else English. */
export const languageOfHeader = header => {
    if (typeof header !== 'string') return 'en';
    const wanted = header
        .split(',')
        .map(part => {
            const [tag, ...params] = part.trim().split(';');
            const q = Number(params.find(param => param.trim().startsWith('q='))?.split('=')[1] ?? 1);
            return { code: tag.slice(0, 2).toLowerCase(), q: Number.isFinite(q) ? q : 0 };
        })
        .filter(entry => LANGUAGES.includes(entry.code) && entry.q > 0)
        .sort((a, b) => b.q - a.q);
    return wanted[0]?.code ?? 'en';
};

/** A page's language: `?lang=` (or the form's `lang`), else the browser's. */
export const languageOfRequest = req => {
    const explicit = req.query?.lang ?? req.body?.lang;
    return typeof explicit === 'string' && LANGUAGES.includes(explicit) ? explicit : languageOfHeader(req.get?.('accept-language'));
};

/** Text `key` in `language` (English when missing), with `{name}` parts from `params`. */
export const text = (language, key, params = {}) =>
    (TEXTS[language]?.[key] ?? TEXTS.en[key] ?? key).replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));

/** Every language has every English key (checked by a test). */
export const missingTexts = () =>
    LANGUAGES.flatMap(language => Object.keys(TEXTS.en).filter(key => !TEXTS[language]?.[key]).map(key => `${language}.${key}`));
