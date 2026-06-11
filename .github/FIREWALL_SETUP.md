# VPS Firewall Configuration for GitHub Actions

## Problem
GitHub Actions runners use dynamic IP addresses that may be blocked by your VPS firewall, causing SSH timeout errors.

## Solution Options

### Option 1: Allow GitHub Actions IP Range (Recommended)
GitHub Actions runners use IPs from these ranges:
- `185.199.108.0/22`
- `140.82.112.0/20`
- `143.55.64.0/20`
- `20.207.73.0/24` (for Actions)

**UFW (Ubuntu):**
```bash
sudo ufw allow from 185.199.108.0/22 to any port 22
sudo ufw allow from 140.82.112.0/20 to any port 22
sudo ufw allow from 143.55.64.0/20 to any port 22
sudo ufw allow from 20.207.73.0/24 to any port 22
```

**iptables:**
```bash
iptables -A INPUT -p tcp -s 185.199.108.0/22 --dport 22 -j ACCEPT
iptables -A INPUT -p tcp -s 140.82.112.0/20 --dport 22 -j ACCEPT
```

### Option 2: Use GitHub-hosted Runners with Static IP
Use a self-hosted runner on a machine with static IP, then whitelist that IP.

### Option 3: Use Webhook-based Deployment
Instead of SSH, use a webhook endpoint on your VPS that triggers deployment.

### Option 4: Temporary Disable Firewall for Testing
```bash
# WARNING: Only for testing!
sudo ufw disable
# Test deployment, then re-enable
sudo ufw enable
```

## Manual Deployment
If automatic deployment fails, you can deploy manually:
```bash
./deploy-vps.sh
```

Or directly:
```bash
ssh root@187.127.26.164
cd /opt/lavameucarro
git pull origin main
docker compose up -d --build
```
