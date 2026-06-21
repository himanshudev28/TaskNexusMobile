package com.tasknexus.ui.screens

import android.annotation.SuppressLint
import android.webkit.ConsoleMessage
import android.webkit.WebChromeClient
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.foundation.background
import androidx.compose.foundation.border
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
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.tasknexus.ui.theme.*

private val DEFAULT_JSX_CODE = """
function App() {
  const [count, setCount] = React.useState(0);

  const styles = {
    container: {
      fontFamily: 'sans-serif',
      padding: '20px',
      maxWidth: '400px',
      margin: '0 auto',
      textAlign: 'center',
    },
    title: {
      color: '#4F46E5',
      fontSize: '28px',
      marginBottom: '10px',
    },
    counter: {
      fontSize: '48px',
      fontWeight: 'bold',
      color: '#1F2937',
      margin: '20px 0',
    },
    btn: {
      background: '#4F46E5',
      color: 'white',
      border: 'none',
      padding: '10px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      cursor: 'pointer',
      margin: '0 8px',
    },
    card: {
      background: '#F9FAFB',
      borderRadius: '12px',
      padding: '20px',
      marginTop: '20px',
      border: '1px solid #E5E7EB',
    },
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>JSX Preview</h1>
      <div style={styles.card}>
        <div style={styles.counter}>{count}</div>
        <button style={styles.btn} onClick={() => setCount(c => c - 1)}>-</button>
        <button style={styles.btn} onClick={() => setCount(c => c + 1)}>+</button>
        <br/><br/>
        <button style={{...styles.btn, background: '#EF4444'}} onClick={() => setCount(0)}>
          Reset
        </button>
      </div>
      <p style={{color: '#6B7280', marginTop: '16px', fontSize: '14px'}}>
        Powered by React + Babel
      </p>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
""".trim()

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun JSXPreviewScreen() {
    var code by remember { mutableStateOf(DEFAULT_JSX_CODE) }
    var consoleMessages by remember { mutableStateOf(listOf<Pair<String, Boolean>>()) } // message to isError
    var webViewRef by remember { mutableStateOf<WebView?>(null) }
    var showConsole by remember { mutableStateOf(false) }
    val clipboard = LocalClipboardManager.current
    var editorExpanded by remember { mutableStateOf(true) }

    fun buildHtml(jsxCode: String): String = """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <script crossorigin src="https://unpkg.com/react@18/umd/react.development.js"></script>
            <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
            <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
            <style>
                * { box-sizing: border-box; margin: 0; padding: 0; }
                body { background: #fff; min-height: 100vh; }
            </style>
        </head>
        <body>
            <div id="root"></div>
            <script type="text/babel">
            try {
                ${jsxCode}
            } catch(e) {
                document.getElementById('root').innerHTML =
                    '<div style="color:red;padding:16px;font-family:monospace;font-size:14px;">' +
                    '<b>Error:</b><br/>' + e.message + '</div>';
                console.error(e.message);
            }
            </script>
        </body>
        </html>
    """.trimIndent()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        // Header
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(
                    modifier = Modifier
                        .size(28.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(Color(0xFF61DAFB).copy(alpha = 0.15f)),
                    contentAlignment = Alignment.Center
                ) {
                    Text("⚛", fontSize = 14.sp)
                }
                Spacer(Modifier.width(10.dp))
                Text("JSX Preview", style = TextStyle(color = OnSurface, fontSize = 20.sp, fontWeight = FontWeight.Bold))
            }
            Row(horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                IconButton(onClick = { clipboard.setText(AnnotatedString(code)) }) {
                    Icon(Icons.Default.ContentCopy, null, tint = OnSurface2)
                }
                IconButton(onClick = { code = DEFAULT_JSX_CODE }) {
                    Icon(Icons.Default.Refresh, null, tint = OnSurface2)
                }
                IconButton(onClick = { editorExpanded = !editorExpanded }) {
                    Icon(
                        if (editorExpanded) Icons.Default.KeyboardArrowUp else Icons.Default.KeyboardArrowDown,
                        null,
                        tint = OnSurface2
                    )
                }
            }
        }

        Column(modifier = Modifier.fillMaxSize()) {
            // Code Editor
            if (editorExpanded) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(0.45f)
                        .background(Color(0xFF0D1117))
                ) {
                    // Editor Header
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(Color(0xFF161B22))
                            .padding(horizontal = 12.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("JSX Code", color = Color(0xFF6E7681), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
                        Text("${code.lines().size} lines", color = Color(0xFF6E7681), fontSize = 11.sp)
                    }

                    BasicTextField(
                        value = code,
                        onValueChange = { code = it },
                        modifier = Modifier
                            .fillMaxWidth()
                            .weight(1f)
                            .padding(12.dp)
                            .verticalScroll(rememberScrollState()),
                        textStyle = TextStyle(
                            color = Color(0xFFE6EDF3),
                            fontSize = 12.sp,
                            fontFamily = FontFamily.Monospace,
                            lineHeight = 20.sp
                        ),
                        cursorBrush = SolidColor(Color(0xFF61DAFB))
                    )
                }
            }

            // Run Button
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Surface2)
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Button(
                    onClick = {
                        consoleMessages = emptyList()
                        webViewRef?.loadDataWithBaseURL(
                            "https://localhost/",
                            buildHtml(code),
                            "text/html",
                            "UTF-8",
                            null
                        )
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF61DAFB).copy(alpha = 0.8f)),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    Icon(Icons.Default.PlayArrow, null, Modifier.size(18.dp), tint = Color.Black)
                    Spacer(Modifier.width(6.dp))
                    Text("Run Preview", color = Color.Black, fontWeight = FontWeight.SemiBold)
                }
                if (consoleMessages.isNotEmpty()) {
                    BadgedBox(
                        badge = {
                            Badge(containerColor = if (consoleMessages.any { it.second }) Danger else Info) {
                                Text("${consoleMessages.size}", color = OnSurface, fontSize = 10.sp)
                            }
                        }
                    ) {
                        IconButton(onClick = { showConsole = !showConsole }) {
                            Icon(Icons.Default.Terminal, null, tint = OnSurface2)
                        }
                    }
                }
            }

            // WebView Preview
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(if (editorExpanded) 0.45f else 0.85f)
                    .background(Color.White)
            ) {
                AndroidView(
                    factory = { ctx ->
                        WebView(ctx).apply {
                            settings.javaScriptEnabled = true
                            settings.domStorageEnabled = true
                            webViewClient = WebViewClient()
                            webChromeClient = object : WebChromeClient() {
                                override fun onConsoleMessage(msg: ConsoleMessage): Boolean {
                                    val isError = msg.messageLevel() == ConsoleMessage.MessageLevel.ERROR
                                    consoleMessages = consoleMessages + (msg.message() to isError)
                                    return true
                                }
                            }
                            loadDataWithBaseURL(
                                "https://localhost/",
                                buildHtml(DEFAULT_JSX_CODE),
                                "text/html",
                                "UTF-8",
                                null
                            )
                        }.also { webViewRef = it }
                    },
                    modifier = Modifier.fillMaxSize()
                )
            }

            // Console Panel
            if (showConsole && consoleMessages.isNotEmpty()) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .heightIn(max = 120.dp)
                        .background(Color(0xFF010409))
                        .padding(8.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Console", color = Color(0xFF6E7681), fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                        Row {
                            TextButton(onClick = { consoleMessages = emptyList() }, contentPadding = PaddingValues(4.dp)) {
                                Text("Clear", color = Color(0xFF6E7681), fontSize = 10.sp)
                            }
                            IconButton(onClick = { showConsole = false }, modifier = Modifier.size(24.dp)) {
                                Icon(Icons.Default.Close, null, Modifier.size(14.dp), tint = Color(0xFF6E7681))
                            }
                        }
                    }
                    Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                        consoleMessages.forEach { (msg, isError) ->
                            Text(
                                text = "${if (isError) "[ERROR]" else "[LOG]"} $msg",
                                color = if (isError) Color(0xFFFF7B72) else Color(0xFF7EE787),
                                fontSize = 11.sp,
                                fontFamily = FontFamily.Monospace,
                                modifier = Modifier.padding(vertical = 1.dp)
                            )
                        }
                    }
                }
            }
        }
    }
}
