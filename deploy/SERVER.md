# Production on a small server (netcup VPS) with a DuckDNS address

Everything runs on one rented Linux server: the backend, MySQL and Caddy (HTTPS), with Docker
Compose ([docker-compose.prod.yml](docker-compose.prod.yml)). Backups are encrypted and copied every
night to Backblaze B2 (free up to 10 GB). Better Stack watches `/api/health` and the backups.

Cost: the server only, about 6–7 € a month with VAT. Everything else is free. One-off time: about 1–2 hours.

| Piece | Service | What it does |
|---|---|---|
| Server | netcup VPS Lite 1: 2 cores, 4 GB RAM, Ubuntu 24.04 | Runs everything (300 rooms at once = up to 1,200 players; more with a bigger plan) |
| Address | DuckDNS (`<name>.duckdns.org`) | Free name pointing at the server |
| HTTPS | Caddy + Let's Encrypt | Certificate fetched and renewed automatically |
| Backups | `backup.sh` → Backblaze B2 | Nightly, encrypted, 30 days kept |
| Monitoring | Better Stack | Alerts when the server or a backup fails |

Placeholders below: `<ip>` = the server's public IPv4 address, `<name>` = your DuckDNS subdomain.

Another provider works the same way (Hetzner, OVH, Contabo, ...): steps 1 and 2 differ, then from
step 3 on everything is identical. You need Ubuntu 24.04, a public IPv4 address, at least 2 GB of RAM
(4 GB is comfortable) and SSH access.

---

## 1. Order the server (netcup)

1. On **netcup.com** → *vServer (VPS)*, order the **VPS Lite 1** (2 vCores, 4 GB RAM, 80 GB SSD):
   €6.25 a month with a 6-month term in November 2026, including 27 % Hungarian VAT. The VPS 500 has
   the same cores and RAM for €8.82, plus a 2.5 Gbit/s port (Lite: 500 Mbit/s) and a choice of
   location (Vienna). Neither matters for a card game: a player sends a few small messages per move
   (500 Mbit/s carries far more than 1,200 players need), and Nuremberg is only 10–15 ms further from
   Hungary than Vienna.
   - Why not bigger: in the load test, 800 rooms used ~1 GB in the backend. With MySQL and the system,
     4 GB carries the default `MAX_ROOMS=300` easily, and the two cores fit that too.
   - When it gets busy: move to the VPS Lite 2 (4 cores, 8 GB, €10.14) and raise `MAX_ROOMS` to 800. Check in
     netcup's FAQ whether an upgrade keeps the disk; otherwise it's a move (steps 2–7 and a restore).
   - **Networking:** keep **IPv4 + IPv6** (€0.00). The IPv6-only options are cheaper, but DuckDNS and
     many players' networks need the IPv4 address.
   - **Location:** the Lite plans can't choose it; they run in Nuremberg. With a plan that can, pick
     Vienna (closest to Hungary).
   - Set-up fee: €0.00, billed every 6 months.
2. Register with your real name and address, and pay by card, SEPA direct debit or PayPal. New
   customers are sometimes checked by hand, which can take a few hours to a day.
3. You'll get two emails: the login for the **CCP** (customer panel: contracts, invoices) and the
   login for the **SCP** (server panel at `servercontrolpanel.de`: reinstall, reboot, console). The
   SCP email also has the server's **IPv4 address** (`<ip>`).

## 2. SSH key and a fresh Ubuntu

1. On your PC, make an SSH key (Git Bash or PowerShell):

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/dutchpub -C dutchpub-server
   ```

   Keep `~/.ssh/dutchpub` (the private key) safe, and put a copy in your password manager.
2. In the **SCP**: your server → *Media* → *Images* → **Ubuntu 24.04**.
   - If the dialog offers an *SSH key* field, paste the contents of `~/.ssh/dutchpub.pub`.
   - Otherwise note the **root password** it shows or emails.
   
   The reinstall takes a few minutes.
3. Leave the SCP's own firewall off. If you do turn it on, allow TCP 22, 80, 443 and UDP 443 there.
   **Never open 3306 or 3030**: MySQL and the backend stay inside the server.

## 3. Your own user (not root)

**Shortcut on netcup:** the image install has a *Create additional user* switch. Turn it on with the user
`dutchpub` and a password, and choose the timezone UTC. The user gets sudo rights, but its
`~/.ssh/authorized_keys` stays empty: log in once with the password, then add your key:

```sh
install -d -m 700 ~/.ssh
echo '<the line from ~/.ssh/dutchpub.pub>' > ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

Then check the key login and `sudo whoami` as below, and go on with step 4.

Without that switch, log in as root once, with the key or the root password:

```sh
ssh -i ~/.ssh/dutchpub root@<ip>
```

Then make a user with sudo rights:

```sh
adduser --gecos "" dutchpub              # choose a password: sudo asks for it. Keep it in your password manager.
usermod -aG sudo dutchpub
install -d -m 700 -o dutchpub -g dutchpub /home/dutchpub/.ssh
nano /home/dutchpub/.ssh/authorized_keys # paste the one line from ~/.ssh/dutchpub.pub, save
chown dutchpub:dutchpub /home/dutchpub/.ssh/authorized_keys
chmod 600 /home/dutchpub/.ssh/authorized_keys
```

**Before closing the root session**, check in a second window that the new login works:

```sh
ssh -i ~/.ssh/dutchpub dutchpub@<ip>
sudo whoami                              # root
```

From now on, log in as `dutchpub`. The setup in step 5 turns root logins and passwords off.

## 4. DuckDNS name

1. Log in at **duckdns.org** (with GitHub or Google).
2. Add a subdomain (`<name>`), type `<ip>` as its address and press *update ip*.
3. Copy the **token** shown at the top. It goes into `deploy/.env`.

Check it from your PC: `nslookup <name>.duckdns.org` should answer `<ip>`.

## 5. Get the code and set up the server

As `dutchpub` on the server (`ssh -i ~/.ssh/dutchpub dutchpub@<ip>`), get the code:

- **If the GitHub repo is public:**

  ```sh
  git clone https://github.com/<you>/dutch_pub.git
  ```

- **If it is private:** give the server a read-only deploy key.

  ```sh
  ssh-keygen -t ed25519 -f ~/.ssh/github -N "" -C dutchpub-server
  cat ~/.ssh/github.pub
  ```

  Paste the printed key into GitHub: *repo → Settings → Deploy keys → Add deploy key* (leave
  *Allow write access* unticked). Then:

  ```sh
  printf 'Host github.com\n  IdentityFile ~/.ssh/github\n' >> ~/.ssh/config
  git clone git@github.com:<you>/dutch_pub.git
  ```

  If the branch with this setup isn't the default branch yet, add `-b react-native` to the clone.

Then run the one-time setup:

```sh
bash ~/dutch_pub/deploy/setup-server.sh
exit
```

[setup-server.sh](setup-server.sh) installs Docker, age and rclone. It also:
- turns on automatic security updates, with a reboot at 04:00 UTC when one is needed;
- allows SSH with keys only and turns root logins off;
- adds the cron jobs: DuckDNS every 5 minutes, backup at 03:30 UTC.

Log in again (`ssh -i ~/.ssh/dutchpub dutchpub@<ip>`) so the Docker permission takes effect.

## 6. Settings and secrets

```sh
cd ~/dutch_pub/deploy
cp env.prod.example .env
cp backend.env.example backend.env
chmod 600 .env backend.env
openssl rand -hex 32   # run once for each secret below, paste the output
nano .env              # DOMAIN, DUCKDNS_*, DB_PASSWORD, DB_ROOT_PASSWORD (backup lines: step 9)
nano backend.env       # JWT_SECRET, PUBLIC_URL, SMTP_*, MAIL_FROM, PRIVACY_*
```

- Use **new** secrets: not the ones from your PC's `backend/.env`, and especially not the database
  password that was once in git history.
- A new `JWT_SECRET` logs everyone out once, which is harmless.
- Copy the SMTP lines (the Gmail app password) and `PRIVACY_*` from your PC's `backend/.env` by hand.
- Both files stay on the server only. They are in `.gitignore`.

## 7. Start it

```sh
cd ~/dutch_pub/deploy
docker compose -f docker-compose.prod.yml up -d --build    # the first build takes a few minutes
docker compose -f docker-compose.prod.yml ps               # db and app "healthy", caddy "running"
curl -s https://<name>.duckdns.org/api/health              # {"status":"ok","database":"ok"}
```

Open `https://<name>.duckdns.org/privacy` in a browser too. It should load with a padlock and no
warning page.

**If something is wrong:**
- **No HTTPS:** `docker compose -f docker-compose.prod.yml logs caddy`. Usually ports 80/443 are closed
  (step 3) or DuckDNS doesn't point at `<ip>` yet.
- **502:** the backend isn't up. Check `... logs app`.

## 8. Move the existing accounts and leaderboard (optional)

On your PC, dump the current database. Use your local MySQL's port and user; with the repo's
`docker compose up db` that is port 3307, user `test`:

```sh
mysqldump -h 127.0.0.1 -P <port> -u <user> -p --single-transaction --no-tablespaces dutch_pub > dutchpub.sql
scp -i ~/.ssh/dutchpub dutchpub.sql dutchpub@<ip>:~/
```

On the server:

```sh
cd ~/dutch_pub/deploy
docker compose -f docker-compose.prod.yml stop app
docker compose -f docker-compose.prod.yml exec -T db sh -c 'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql -uroot dutch_pub' < ~/dutchpub.sql
docker compose -f docker-compose.prod.yml start app
shred -u ~/dutchpub.sql
```

The dump contains emails and password hashes, so delete it on your PC as well.

## 9. Backups: Backblaze B2, encrypted

**a. Encryption key.** Run this on the server:

```sh
age-keygen -o /tmp/backup-key.txt && cat /tmp/backup-key.txt
```

- Copy **all three lines** into your password manager. Without the private key (`AGE-SECRET-KEY-...`)
  the backups can't be read, by anyone, including you.
- Put the `# public key: age1...` value into `.env` as `BACKUP_AGE_RECIPIENT`.
- Then delete the file: `shred -u /tmp/backup-key.txt`.

The server only ever has the public key, so someone who breaks in can't read old backups.

**b. Backblaze B2.** Sign up at **backblaze.com** → *B2 Cloud Storage* (free, no card needed for the
free 10 GB).

1. *Buckets → Create a Bucket*:
   - **Name:** something unique, e.g. `dutchpub-backups-` plus a few random characters
   - **Files:** *Private*
   - **Object lock:** off
2. On the bucket: *Lifecycle Settings → Use custom lifecycle rules*. Use file name prefix empty,
   *days till hide* `30` and *days till delete* `1`. Backups are then kept for 30 days and removed by B2
   itself.
3. *Application Keys → Add a New Application Key*:
   - **Name:** `dutchpub-server`
   - **Bucket:** only the new bucket
   - **Type of access:** **Write Only**. The server can add backups but never delete them.
   - Note the *keyID* and *applicationKey*. The key is shown only once.

**c. rclone on the server.** Run `rclone config` and answer:

| Prompt | Answer |
|---|---|
| New remote | `n` |
| name | `b2` |
| Storage | `b2` |
| account | *keyID* |
| key | *applicationKey* |
| hard_delete | Enter (no) |
| Edit advanced config | `n` |
| Keep this remote | `y` |

Then `q` to quit. Set `BACKUP_REMOTE=b2:<bucket name>` in `.env`.

**d. Heartbeat.** Better Stack (step 10) → *Uptime → Heartbeats → Create heartbeat*:
- **Name:** "Dutch Pub backup"
- **Expected every:** 1 day
- **Grace period:** 2 hours

Copy its URL into `.env` as `BACKUP_HEARTBEAT_URL`.

**e. Test it:**

```sh
~/dutch_pub/deploy/backup.sh     # "Backup done: backups/dutch_pub-....sql.gz.age (..K)"
```

The file should now be in the B2 bucket, and the heartbeat should be green. The nightly cron job does
the same at 03:30 UTC. Its log is `deploy/backups/backup.log`.

- If rclone says *unauthorized* with the write-only key, make a *Read and Write* key for the bucket
  instead. That works too, but then a stolen key could delete backups.

**f. Restore** (try it once, so you know it works). The server's B2 key can't read files, so take the
backup from the B2 website: *Buckets → Browse Files → (file) → Download*. Then copy it to the server:

```sh
scp -i ~/.ssh/dutchpub <backup file> dutchpub@<ip>:~/dutch_pub/deploy/
```

On the server:

```sh
cd ~/dutch_pub/deploy
nano /tmp/key.txt                         # paste the three key lines from your password manager
./restore.sh <backup file name> /tmp/key.txt
shred -u /tmp/key.txt
```

[restore.sh](restore.sh) stops the backend, replaces the database and starts the backend again. Any
backup from the server's own `deploy/backups/` folder (the last 14 days) works the same way.

## 10. Monitoring: Better Stack

Sign up at **betterstack.com** (the free plan: 10 monitors, checks every 3 minutes, commercial use allowed).

1. *Uptime → Monitors → Create monitor*:
   - **Alert us when:** *URL becomes unavailable*
   - **URL:** `https://<name>.duckdns.org/api/health`
   - **Check frequency:** 3 minutes
   
   `/api/health` answers 200 only when the backend **and** the database work, and 503 otherwise.
2. *On-call / notifications*: email, and install the Better Stack app on your phone for push alerts.
3. Optional: in the monitor's advanced settings, turn on *SSL certificate expiration* alerts (Caddy
   renews by itself; this only catches it if renewing ever fails).

The backup heartbeat (step 9d) is the second check: no successful backup within a day sends an alert.

## 11. The app

The app must call the new address:

1. expo.dev → the project → *Environment variables* → `EXPO_PUBLIC_API_URL` = `https://<name>.duckdns.org`
   for **preview** and **production**.
2. Build a new APK: `npx eas-cli build --platform android --profile preview`.
3. APKs already installed keep calling the old ngrok address. Keep the PC backend running until
   everyone has installed the new one, then stop it.

## 12. Web version of the app (for iPhones)

The same app runs in a browser, served by Caddy at its own name (`WEB_DOMAIN`, e.g. `play.dutchpub.eu`).
No push notifications there, and sounds start after the first tap.

1. **DNS:** an `A` record for the name (host `play` at your registrar) pointing at `<ip>`.
2. **Server settings** (once):

   ```sh
   cd ~/dutch_pub/deploy
   printf '\nWEB_DOMAIN=play.dutchpub.eu\n' >> .env
   printf '\nCORS_ORIGIN=https://play.dutchpub.eu\n' >> backend.env
   mkdir -p web                       # before Docker creates it (as root)
   docker compose -f docker-compose.prod.yml run --rm --no-deps caddy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile
   docker compose -f docker-compose.prod.yml up -d
   ```

3. **Publish** from your PC (Git Bash, in the repo), now and after every app change:

   ```sh
   deploy/publish-web.sh dutchpub@<ip> -i ~/.ssh/dutchpub
   ```

   It builds the web version for `https://dutchpub.eu` and copies it to `deploy/web`; no restart needed.

## Updating the server later

```sh
cd ~/dutch_pub && git pull
cd deploy && docker compose -f docker-compose.prod.yml up -d --build
docker image prune -f
```

Running games survive the restart: they are saved every second and loaded back.

Monthly, also refresh MySQL and Caddy to their latest patch versions:

```sh
docker compose -f docker-compose.prod.yml pull && docker compose -f docker-compose.prod.yml up -d
```

## Security summary

- Only ports 22 (SSH, keys only), 80 and 443 are open. MySQL and the backend are reachable only inside Docker.
- Secrets live only in `deploy/.env` and `deploy/backend.env` (mode 600, gitignored). The backend
  container never sees the database root password or the backup and DuckDNS settings.
- Ubuntu security updates install by themselves (reboot at 04:00 UTC when needed). Docker restarts
  every service after a reboot.
- Backups:
  - encrypted on the server with a public key; the private key is only in your password manager;
  - the B2 key can only add files, and B2 deletes them after 30 days.
- HTTPS everywhere (HSTS); the backend trusts exactly one proxy (Caddy) for client addresses.

## Limits to know

- **DuckDNS** is a free volunteer service with occasional short outages. Before the Play Store, or once
  ads need an `app-ads.txt`, consider a real domain (~10 €/year). Change `DOMAIN`, `PUBLIC_URL` and
  the app's `EXPO_PUBLIC_API_URL`.
- **Growing:** the VPS Lite 1 runs 300 rooms (`MAX_ROOMS`), up to 1,200 players at once. For more: the VPS Lite 2 (4 cores, 8 GB) and `MAX_ROOMS=800`. Moving to another provider means steps 2–7 there plus a restore from the latest backup (step 9f).
