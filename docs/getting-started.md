# From Zero to Running App: A GitHub Walkthrough for Non-Developers

If you've arrived here from LinkedIn, there's a decent chance this is your first time on GitHub.
If so: welcome. You're about to discover that it's considerably less intimidating than it looks.

And in fact, you've already started. This page — the thing you're reading right now — is a GitHub
document. It's one of the simplest things on GitHub: just a document, hosted publicly, with a clean
URL you can share. No folders, no code, no moving parts. If you can read this, you can use GitHub.
Everything else is just a little more of the same.

GitHub is where most software projects live. Think of it as a shared folder — one that keeps a
complete history of every change ever made to the files inside it. Developers use it to collaborate
on code, but the documents you'll be reading (called READMEs) are written in plain English. They
explain what a project is and how to use it. That's all you need.

By the time you've finished this guide, you'll have done four things: read a GitHub document (done
— you're doing it now), navigated a GitHub project, copied it to your own computer, and run a
working application. That's a solid first day.

---

## What this project is

This is a bookmark manager — an app that imports your browser bookmarks, checks which links still
work, and lets you search the whole collection in plain English. A later update will add AI-powered
categorisation and summaries — I'll walk you through that step when it's ready, and it'll be just
as straightforward as the setup you're about to do. For now, the app handles import and
link-checking, and it runs entirely on your own computer. No account to create, no data leaving
your machine.

It was built as part of an experiment called **Built Twice** — one detailed brief, given to two
different AI coding tools, to see how each approaches the same problem. There are two versions:

| Build | Repository |
| ----------- | ---------------------------------------- |
| Claude Code | github.com/just-code-in/bookmark-manager-claude |
| Codex | github.com/just-code-in/bookmark-manager-codex |

Both do the same thing. They just got there differently. Pick either one — or try both if you're
curious about the differences.

---

## First things first: opening your terminal

Before we install anything, let's get comfortable with the one tool you'll be using throughout
this guide.

Your terminal is how you talk to your computer using text instead of clicks. It looks intimidating
the first time — a blank screen with a blinking cursor, no icons, no menus, nothing to suggest
what you're supposed to do next. Don't worry. You're only going to type a handful of short
commands, and every single one is provided for you below, ready to copy and paste. You won't need
to memorise anything or figure out commands on your own.

| How to open it | What you'll see |
| -------------------------------------------- | ------------------------------ |
| **Mac:** Press `Cmd + Space`, type "Terminal", press Enter | `username@MacBook ~ %` |
| **Windows:** Press the Windows key, type "Command Prompt", press Enter | `C:\Users\YourName>` |

That blinking cursor is just waiting for you to type something. We'll give it something to do
shortly.

> **Tip:** Developers copy and paste commands into their terminal constantly. It's not a shortcut
> or a cheat — it's genuinely how the work gets done. Every command in this guide is designed to
> be copied straight from this page and pasted in.

---

## Before you start: two things to install

You'll need two tools on your computer before you can run the app. Each takes about five minutes
to set up.

### 1. Node.js

Node.js is the engine that runs the app. Without it, your computer doesn't know how to interpret
the code.

To install:

1. Go to nodejs.org
2. Download the version marked **LTS** (Long Term Support) — it's the big green button
3. Run the installer like any other application
4. Accept the defaults — you don't need to change any settings

To check it's working, copy and paste this into your terminal:

```bash
node --version
```

> **Note:** If you see a version number (something like `v20.11.0`), you're good. If you see an
> error, the installation didn't complete — try restarting your computer and running the installer
> again.

### 2. Git

Git is the tool that copies the project from GitHub to your computer. The process is called
"cloning" — as in, you're making a clone of the project on your own machine.

#### Mac

1. Copy and paste this into Terminal:

   ```bash
   xcode-select --install
   ```

2. Your Mac will ask you to install "command line developer tools" — say yes. This installs Git
   along with a few other useful things. It may take a few minutes.
3. Once it's done, check it worked:

   ```bash
   git --version
   ```

   You should see a version number. If you do, you're set.

#### Windows

1. Go to git-scm.com and click the download button
2. Run the installer like any other application
3. Accept the defaults — you don't need to change any settings
4. Once it's done, open a new Command Prompt window and check it worked:

   ```bash
   git --version
   ```

   You should see a version number. If you do, you're set.

(If you've tinkered with GitHub before, you may already have Git installed — in which case the
version check above will confirm it and you can move straight on.)

---

## Getting the app onto your computer

This is the part that sounds technical but is actually just a few commands, each of which you'll
copy and paste.

### Step 1: Create a home for your projects

Let's give the project a sensible place to live. You only need to do this once — after that,
you'll have a dedicated folder for anything you clone from GitHub.

**Mac:**

```bash
mkdir -p ~/Projects && cd ~/Projects
```

**Windows:**

```bash
mkdir %USERPROFILE%\Projects && cd %USERPROFILE%\Projects
```

> **Note:** This creates a folder called "Projects" in your home directory and moves you into it.
> You'll find it in Finder (Mac) or File Explorer (Windows) alongside Documents, Downloads, and
> the rest.

### Step 2: Clone the project

Now the main event. This is the command that copies the entire project from GitHub to your
computer. Pick the build you want and copy the whole line.

If you want the Claude Code build:

```bash
git clone https://github.com/just-code-in/bookmark-manager-claude.git
```

If you want the Codex build:

```bash
git clone https://github.com/just-code-in/bookmark-manager-codex.git
```

You'll see a few lines scroll past — that's Git doing its work. It takes a few seconds. When it's
done, you'll have a new folder inside Projects containing everything you see on the GitHub page.

### Step 3: Move into the project folder

**Claude Code build:**

```bash
cd bookmark-manager-claude
```

**Codex build:**

```bash
cd bookmark-manager-codex
```

You're now "inside" the project. Every command you type from here will apply to this project.

---

## A quick look at the GitHub project page

Before we continue in the terminal, it's worth knowing what the project looks like on GitHub —
because you'll come back to it for updates and information.

When you open either of the links above, the page has two main sections.

The **file list** sits at the top — rows of folders and files with names like `src`,
`package.json`, and `README.md`. This is the project's code. You don't need to open any of it.
Think of it the way you'd think of the engine bay of a car: it's there, it works, and you don't
need to lift the bonnet to drive.

The **README** appears below the file list. It's the owner's manual — written in plain English,
explaining what the project does and how to use it. The README in each repo contains a condensed
version of these same instructions.

> **Tip:** A few other things you'll notice: **Stars** (top right) are a "like" button — this
> project is new, so don't judge it by the count. **Issues** (tab at the top) is where you'd
> leave a note if you get stuck — think of it as a comments section. **Code** (green button) is
> how you'd copy the project URL, but you've already done that step.

---

## Installing the app's dependencies

Back in your terminal. Software projects rely on other software — libraries, frameworks, tools.
These are called "dependencies," and they're listed in a file called `package.json`. You don't
need to understand what they are. You just need to install them.

One command (same on Mac and Windows):

```bash
npm install
```

This will take a minute or two. You'll see a progress bar and a lot of text.

> **Tip:** Don't worry about warnings — they're normal. When it finishes, you'll see something
> like "added 347 packages." That means it worked.

**What just happened?** You told Node's package manager (npm) to read the project's shopping list
of dependencies and install them all. They now live in a folder called `node_modules` inside the
project. You'll never need to look inside it.

---

## Running the app

Now the moment that makes everything worth it (same on Mac and Windows):

```bash
npm run dev
```

After a few seconds, you'll see a message that says something like:

```text
  ➜  Local:   http://localhost:3000/
```

Open your web browser and go to that address. You'll see the bookmark manager.

> **Important:** That's it. The app is running on your computer. No account, no cloud service, no
> deployment. Just your machine.

### What you'll see

When you first open the app, you'll see an empty dashboard — it's waiting for you to import your
bookmarks. The interface has a few key areas:

| Area | What it does |
| ------- | ---------------------------------------------------- |
| Import | Where you'll upload your browser's bookmark export file |
| Library | Where your bookmarks live once imported, organised and searchable |
| Search | Where you can search your bookmarks in plain English |

Don't worry if it looks sparse at first. Once you import your bookmarks, it comes alive — checking
links, organising, surfacing things you'd forgotten you saved. That's when it gets interesting.

---

## Exporting your bookmarks (so you have something to import)

The app needs your bookmarks in a standard format. Find your browser below:

### Chrome

1. Go to `chrome://bookmarks` (type it in the address bar)
2. Click the three dots menu (top right of the bookmarks page)
3. Select "Export bookmarks"
4. Save the HTML file somewhere you'll remember

### Safari

1. Go to File → Export Bookmarks
2. Save the HTML file

### Firefox

1. Open the Library (`Ctrl+Shift+B` on Windows, `Cmd+Shift+B` on Mac)
2. Click Import and Backup → Export Bookmarks to HTML
3. Save the file

### Edge

1. Go to `edge://favorites`
2. Click the three dots menu
3. Select "Export favorites"
4. Save the HTML file

Once you have the file, use the Import feature in the app to load it. The app will do the rest.

---

## What's coming next

> **Note:** What you've just set up handles the first phase: importing your bookmarks and checking
> which links still work. A future update will add the clever part — AI-powered categorisation and
> summaries that make your entire bookmark collection searchable in plain English.

When that's ready, there'll be one additional setup step: connecting an AI service (an API key) so
the app can do the categorising. There's a short guide for that — [Your First API
Key](./your-first-api-key.md) — written in exactly the same style as this one. It's a five-minute
job: you'll copy and paste a key into a settings file, and the app takes it from there.

For now, you have a fully working bookmark manager. Get your bookmarks imported, see what's there,
and enjoy the fact that you're running software you cloned from GitHub.

---

## Stopping and restarting the app

When you're done, go back to your terminal and press `Ctrl + C` (same on Mac and Windows). That
stops the app.

To start it again later, open your terminal and run:

**Mac:**

```bash
cd ~/Projects/bookmark-manager-claude && npm run dev
```

**Windows:**

```bash
cd %USERPROFILE%\Projects\bookmark-manager-claude && npm run dev
```

(Swap `bookmark-manager-claude` for `bookmark-manager-codex` if that's the one you cloned.)

You don't need to install dependencies again — that's a one-time step.

---

## Updating to the latest version

As the project evolves during the Built Twice series, I'll be pushing updates — including the AI
categorisation step mentioned above. To get the latest version, open your terminal and copy these
lines one at a time:

**Mac:**

```bash
cd ~/Projects/bookmark-manager-claude
git pull
npm install
npm run dev
```

**Windows:**

```bash
cd %USERPROFILE%\Projects\bookmark-manager-claude
git pull
npm install
npm run dev
```

> **Tip:** The first line takes you to the project folder. The second fetches any changes from
> GitHub. The third makes sure any new dependencies are installed. The fourth starts the app. Four
> commands, ten seconds.

---

## If something goes wrong

**"Command not found: node" or "Command not found: git"**
The installation didn't stick. Try restarting your computer, then run the installer again.

**`npm install` shows errors (not just warnings)**
Make sure you're inside the project folder. Type `ls` (Mac) or `dir` (Windows) — you should see
files like `package.json` and `README.md`. If you don't, you're in the wrong folder.

**The app starts but the page is blank**
Try a hard refresh: `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows).

**Truly stuck?** Open an Issue on the GitHub project page — there's an "Issues" tab at the top.
Describe what happened, what you expected, and what you see. Think of it as leaving a note for the
project maintainer. Searching for the exact error message in Google is also, genuinely, how every
developer solves problems. You're not doing it wrong. That's the process.

---

## What you've just done

If you've followed this guide, you've:

1. Read a GitHub document (you're still doing it)
2. Opened a terminal and used it without incident
3. Installed developer tools (Node.js and Git)
4. Cloned a repository
5. Installed dependencies
6. Run a local application

That's not nothing. Most developers did exactly this the first time they touched a real project.
The difference is that nobody told them it was straightforward — so it felt harder than it was.

Welcome to GitHub. It gets easier from here.
