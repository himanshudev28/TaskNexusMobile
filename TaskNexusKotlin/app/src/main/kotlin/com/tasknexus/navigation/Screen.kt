package com.tasknexus.navigation

sealed class Screen(val route: String, val label: String, val icon: String) {
    object Dashboard    : Screen("dashboard",    "Dashboard",    "home")
    object Notes        : Screen("notes",        "Notes",        "description")
    object NoteEditor   : Screen("note_editor/{noteId}", "Note", "edit")
    object Todo         : Screen("todo",         "To-Do",        "check_box")
    object Reminders    : Screen("reminders",    "Reminders",    "notifications")
    object Timer        : Screen("timer",        "Timer",        "timer")
    object Budget       : Screen("budget",       "Budget",       "attach_money")
    object QuickLinks   : Screen("quicklinks",   "Quick Links",  "link")
    object Calculator   : Screen("calculator",   "Calculator",   "calculate")
    object Converter    : Screen("converter",    "Converter",    "swap_horiz")
    object QRCode       : Screen("qrcode",       "QR Code",      "qr_code")
    object Generators   : Screen("generators",   "Generators",   "auto_awesome")
    object DateTime     : Screen("datetime",     "Date & Time",  "schedule")
    object ImageTools   : Screen("imagetools",   "Image Tools",  "image")
    object Signature    : Screen("signature",    "Signature",    "draw")
    object TextTools    : Screen("texttools",    "Text Tools",   "text_fields")
    object DevTools     : Screen("devtools",     "Dev Tools",    "code")
    object DataTesting  : Screen("datatesting",  "Data Testing", "science")
    object RSSFeeds     : Screen("rssfeeds",     "RSS Feeds",    "rss_feed")
    object SEOTools     : Screen("seotools",     "SEO Tools",    "search")
    object NetworkTools : Screen("networktools", "Network",      "wifi")
    object PDFTools     : Screen("pdftools",     "PDF Tools",    "picture_as_pdf")
    object PDFEditor    : Screen("pdfeditor",    "PDF Editor",   "edit_document")
    object CodeEditor   : Screen("codeeditor",   "Code Editor",  "terminal")
    object JSXPreview   : Screen("jsxpreview",   "JSX Preview",  "preview")
    object AIImageGen   : Screen("aigen",        "AI Image Gen", "auto_fix_high")

    companion object {
        val navItems = listOf(
            Dashboard, Notes, Todo, Reminders, Timer, Budget, QuickLinks,
            Calculator, Converter, QRCode, Generators, DateTime, ImageTools, Signature,
            TextTools, DevTools, DataTesting, RSSFeeds, SEOTools, NetworkTools, PDFTools,
            PDFEditor, CodeEditor, JSXPreview, AIImageGen
        )
    }
}
