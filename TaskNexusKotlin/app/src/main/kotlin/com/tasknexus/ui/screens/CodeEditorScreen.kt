package com.tasknexus.ui.screens

import android.annotation.SuppressLint
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.*
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.tasknexus.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CodeEditorScreen() {
    var language by remember { mutableStateOf("JavaScript") }
    var code by remember { mutableStateOf(defaultCode("JavaScript")) }
    var jsOutput by remember { mutableStateOf("") }
    var showOutput by remember { mutableStateOf(false) }
    val clipboard = LocalClipboardManager.current

    val languages = listOf("JavaScript", "Python", "HTML", "CSS", "JSON")

    var webViewRef by remember { mutableStateOf<WebView?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Code Editor", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
                Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    IconButton(onClick = { clipboard.setText(AnnotatedString(code)) }) {
                        Icon(Icons.Default.ContentCopy, null, tint = OnSurface2)
                    }
                    IconButton(onClick = { code = ""; jsOutput = "" }) {
                        Icon(Icons.Default.Delete, null, tint = OnSurface2)
                    }
                }
            }
        }

        // Language Selector
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface2)
                .horizontalScroll(rememberScrollState())
                .padding(horizontal = 16.dp, vertical = 10.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            languages.forEach { lang ->
                FilterChip(
                    selected = language == lang,
                    onClick = {
                        language = lang
                        if (code.isEmpty()) code = defaultCode(lang)
                    },
                    label = { Text(lang, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = languageColor(lang).copy(alpha = 0.2f),
                        selectedLabelColor = languageColor(lang)
                    )
                )
            }
        }

        HorizontalDivider(color = BorderColor, thickness = 1.dp)

        Column(modifier = Modifier.fillMaxSize()) {
            // Editor Area
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .background(Color(0xFF0D1117))
            ) {
                val scrollState = rememberScrollState()
                val lineCount = code.lines().size

                Row(modifier = Modifier.fillMaxSize()) {
                    // Line Numbers
                    Box(
                        modifier = Modifier
                            .width(40.dp)
                            .fillMaxHeight()
                            .background(Color(0xFF161B22))
                            .verticalScroll(scrollState)
                            .padding(vertical = 12.dp, horizontal = 6.dp)
                    ) {
                        Column {
                            repeat(maxOf(lineCount, 1)) { i ->
                                Text(
                                    text = "${i + 1}",
                                    color = Color(0xFF6E7681),
                                    fontSize = 12.sp,
                                    fontFamily = FontFamily.Monospace,
                                    lineHeight = 20.sp
                                )
                            }
                        }
                    }

                    // Code Input
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxHeight()
                            .verticalScroll(scrollState)
                            .padding(horizontal = 12.dp, vertical = 12.dp)
                    ) {
                        BasicTextField(
                            value = code,
                            onValueChange = { code = it },
                            modifier = Modifier.fillMaxWidth(),
                            textStyle = TextStyle(
                                color = Color(0xFFE6EDF3),
                                fontSize = 13.sp,
                                fontFamily = FontFamily.Monospace,
                                lineHeight = 20.sp
                            ),
                            cursorBrush = SolidColor(Primary),
                            decorationBox = { innerTextField ->
                                if (code.isEmpty()) {
                                    Text(
                                        "// Start coding...",
                                        color = Color(0xFF6E7681),
                                        fontSize = 13.sp,
                                        fontFamily = FontFamily.Monospace
                                    )
                                }
                                innerTextField()
                            }
                        )
                    }
                }
            }

            // Bottom Bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface2)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                AssistChip(
                    onClick = {},
                    label = { Text(language, fontSize = 11.sp) },
                    modifier = Modifier.height(28.dp),
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = languageColor(language).copy(alpha = 0.15f),
                        labelColor = languageColor(language)
                    )
                )
                Text(
                    "${code.lines().size} lines | ${code.length} chars",
                    color = OnSurface3,
                    fontSize = 11.sp,
                    modifier = Modifier.weight(1f)
                )
                if (language == "JavaScript") {
                    Button(
                        onClick = {
                            showOutput = true
                            webViewRef?.let { wv ->
                                wv.evaluateJavascript(
                                    """
                                    (function() {
                                        var output = [];
                                        var origLog = console.log;
                                        console.log = function() { output.push(Array.from(arguments).join(' ')); origLog.apply(console, arguments); };
                                        try { $code } catch(e) { output.push('Error: ' + e.message); }
                                        console.log = origLog;
                                        return output.join('\n');
                                    })()
                                    """.trimIndent()
                                ) { result ->
                                    jsOutput = result?.removeSurrounding("\"")
                                        ?.replace("\\n", "\n")
                                        ?.replace("\\\"", "\"")
                                        ?: "(no output)"
                                }
                            }
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = Success),
                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                        modifier = Modifier.height(32.dp)
                    ) {
                        Icon(Icons.Default.PlayArrow, null, Modifier.size(14.dp))
                        Spacer(Modifier.width(4.dp))
                        Text("Run", fontSize = 12.sp)
                    }
                }
            }

            // Hidden WebView for JS execution
            if (language == "JavaScript") {
                AndroidView<WebView>(
                    factory = { ctx ->
                        WebView(ctx).apply {
                            @Suppress("SetJavaScriptEnabled")
                            settings.javaScriptEnabled = true
                            webViewClient = WebViewClient()
                            loadData("<html><body></body></html>", "text/html", "utf-8")
                            visibility = android.view.View.GONE
                        }.also { webViewRef = it }
                    },
                    modifier = Modifier.size(1.dp)
                )
            }

            // JS Output Panel
            if (showOutput && language == "JavaScript") {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 160.dp)
                        .background(Color(0xFF010409))
                        .padding(12.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Output", color = Color(0xFF6E7681), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        IconButton(onClick = { showOutput = false; jsOutput = "" }, modifier = Modifier.size(24.dp)) {
                            Icon(Icons.Default.Close, null, Modifier.size(14.dp), tint = Color(0xFF6E7681))
                        }
                    }
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = jsOutput.ifEmpty { "Run code to see output..." },
                        color = if (jsOutput.contains("Error")) Color(0xFFFF7B72) else Color(0xFF7EE787),
                        fontSize = 12.sp,
                        fontFamily = FontFamily.Monospace,
                        modifier = Modifier.verticalScroll(rememberScrollState())
                    )
                }
            }
        }
    }
}

private fun languageColor(lang: String): Color = when (lang) {
    "JavaScript" -> Color(0xFFF1E05A)
    "Python" -> Color(0xFF3572A5)
    "HTML" -> Color(0xFFE34C26)
    "CSS" -> Color(0xFF563D7C)
    "JSON" -> Color(0xFF8BC34A)
    else -> Primary
}

private fun defaultCode(language: String): String = when (language) {
    "JavaScript" -> """// JavaScript Example
function greet(name) {
    return `Hello, ${"\${name}"}!`;
}

const names = ["World", "Kotlin", "Android"];
names.forEach(name => {
    console.log(greet(name));
});

// Array manipulation
const nums = [1, 2, 3, 4, 5];
const sum = nums.reduce((a, b) => a + b, 0);
console.log("Sum:", sum);"""

    "Python" -> """# Python Example
def greet(name):
    return f"Hello, {name}!"

names = ["World", "Kotlin", "Android"]
for name in names:
    print(greet(name))

# List comprehension
squares = [x**2 for x in range(1, 6)]
print("Squares:", squares)"""

    "HTML" -> """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
</head>
<body>
    <h1>Hello, World!</h1>
    <p>This is a paragraph.</p>
    <ul>
        <li>Item 1</li>
        <li>Item 2</li>
    </ul>
</body>
</html>"""

    "CSS" -> """/* CSS Example */
:root {
    --primary: #4F46E5;
    --text: #1F2937;
}

body {
    font-family: 'Inter', sans-serif;
    background: #F9FAFB;
    color: var(--text);
    margin: 0;
    padding: 1rem;
}

.container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}"""

    "JSON" -> """{
    "name": "TaskNexus",
    "version": "1.0.0",
    "description": "All-in-one productivity app",
    "features": [
        "Notes",
        "Todo",
        "Reminders",
        "Budget",
        "Dev Tools"
    ],
    "settings": {
        "theme": "dark",
        "language": "en",
        "notifications": true
    }
}"""
    else -> ""
}
