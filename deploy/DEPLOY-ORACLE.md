# Production on Oracle Cloud (Always Free) with a DuckDNS address

Everything runs on one free Oracle virtual server: the backend, MySQL and Caddy (HTTPS), with
Docker Compose ([docker-compose.prod.yml](docker-compose.prod.yml)). Backups are encrypted and copied
every night to Backblaze B2 (free up to 10 GB). Better Stack watches `/api/health` and the backups.

Cost: 0 €. One-off time: about 1–2 hours.

| Piece | Service | What it does |
|---|---|---|
| Server | Oracle Cloud Always Free, ARM VM (2 CPUs, 12 GB RAM) | Runs everything |
| Address | DuckDNS (`<name>.duckdns.org`) | Free name pointing at the server |
| HTTPS | Caddy + Let's Encrypt | Certificate fetched and renewed automatically |
| Backups | `backup.sh` → Backblaze B2 | Nightly, encrypted, 30 days kept |
| Monitoring | Better Stack | Alerts when the server or a backup fails |

Placeholders below: `<ip>` = the server's public IP address, `<name>` = your DuckDNS subdomain.

---

## 1. Oracle Cloud account

1. Sign up at **oracle.com/cloud/free**. A card is needed for identity checks (a small temporary hold,
   not a charge).
2. **Home region:** it can't be changed later. Pick one in Europe near Hungary, e.g. *Germany Central
   (Frankfurt)*. It has three data centres, so free ARM servers are more often available there.
3. After signup, **upgrade to Pay As You Go**: *Billing & Cost Management → Upgrade and Manage Payment*.
   - It stays free as long as you only use Always Free resources.
   - It stops Oracle from reclaiming "idle" free servers. A quiet game server uses little CPU, so it
     can look idle.
   - It also makes free ARM capacity easier to get.
4. Set a **budget alert** so that a mistake can't cost money unnoticed: *Billing → Budgets → Create
   Budget*, 1 €/month, alert at 1 % (an email at the first cent).

## 2. The server (VM)

1. On your PC, make an SSH key (Git Bash or PowerShell):

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/dutchpub -C dutchpub-server
   ```

   Keep `~/.ssh/dutchpub` (the private key) safe, and put a copy in your password manager.
2. *Compute → Instances → Create instance*:
   - **Name:** `dutchpub`
   - **Image:** *Canonical Ubuntu 24.04* (the aarch64 / ARM build, picked automatically with the shape below)
   - **Shape:** *Ampere → VM.Standard.A1.Flex*, **2 OCPUs, 12 GB memory** (the Always Free limit)
   - **Networking:** *Create new virtual cloud network*, *public subnet*, **Assign a public IPv4 address: yes**
   - **SSH keys:** *Upload public key* → `~/.ssh/dutchpub.pub`
   - **Boot volume:** the default (~47 GB) is fine. Up to 200 GB in total is free.
3. **"Out of capacity"?**
   - Try another *Availability domain* in the same dialog, or try again later. Capacity frees up during
     the day.
   - Fallback: shape *VM.Standard.E2.1.Micro* (AMD, 1 GB RAM, also free). Then set `MAX_ROOMS=100` in
     `backend.env`.
4. Note the **Public IP address** on the instance page (`<ip>`).

## 3. Open ports 80 and 443 in Oracle's network

*Networking → Virtual cloud networks → (your VCN) → Subnets → (public subnet) → Security Lists →
Default Security List → Add Ingress Rules*. Add three rules, each with Source CIDR `0.0.0.0/0`:

| IP protocol | Destination port |
|---|---|
| TCP | 80 |
| TCP | 443 |
| UDP | 443 |

Port 22 (SSH) is already open. **Don't open 3306 or 3030**: MySQL and the backend stay inside the server.

## 4. DuckDNS name

1. Log in at **duckdns.org** (with GitHub or Google).
2. Add a subdomain (`<name>`), type `<ip>` as its address and press *update ip*.
3. Copy the **token** shown at the top. It goes into `deploy/.env`.

Check it from your PC: `nslookup <name>.duckdns.org` should answer `<ip>`.

## 5. Log in to the server and set it up

```sh
ssh -i ~/.ssh/dutchpub ubuntu@<ip>
```

Get the code:

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
- opens ports 80 and 443 in the VM's own firewall (Oracle's Ubuntu blocks them besides the step 3 rules);
- turns on automatic security updates, with a reboot at 04:00 UTC when one is needed;
- allows SSH with keys only;
- adds the cron jobs: DuckDNS every 5 minutes, backup at 03:30 UTC.

Log in again (`ssh -i ~/.ssh/dutchpub ubuntu@<ip>`) so the Docker permission takes effect.

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
scp -i ~/.ssh/dutchpub dutchpub.sql ubuntu@<ip>:~/
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
scp -i ~/.ssh/dutchpub <backup file> ubuntu@<ip>:~/dutch_pub/deploy/
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
- **Oracle** may change the free allowance again (it halved the ARM limits in 2026). The setup is plain
  Docker, so moving to another server means steps 5–9 there plus a restore from the latest backup.
