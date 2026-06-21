package com.tasknexus.ui.screens

import android.util.Base64
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.net.URLDecoder
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

// ---------------------------------------------------------------------------
// TextToolsScreen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TextToolsScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Case", "Clean", "Count", "Encode")
    var inputText by remember { mutableStateOf("") }
    var resultText by remember { mutableStateOf("") }
    val clipboardManager = LocalClipboardManager.current

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index; resultText = "" },
                    text = { Text(title) }
                )
            }
        }

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Shared input
            OutlinedTextField(
                value = inputText,
                onValueChange = { inputText = it },
                label = { Text("Input Text") },
                modifier = Modifier
                    .fillMaxWidth()
                    .heightIn(min = 120.dp),
                minLines = 4,
                placeholder = { Text("Type or paste your text here...") }
            )

            // Tab-specific controls
            when (selectedTab) {
                0 -> CaseTab(inputText = inputText, onResult = { resultText = it })
                1 -> CleanTab(inputText = inputText, onResult = { resultText = it })
                2 -> CountTab(inputText = inputText)
                3 -> EncodeTab(inputText = inputText, onResult = { resultText = it })
            }

            // Result area (not shown for Count tab which renders inline)
            if (selectedTab != 2 && resultText.isNotEmpty()) {
                HorizontalDivider()
                Text("Result", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text(
                            resultText,
                            fontFamily = FontFamily.Monospace,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
                OutlinedButton(
                    onClick = { clipboardManager.setText(AnnotatedString(resultText)) },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Copy Result")
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Case Tab
// ---------------------------------------------------------------------------

@Composable
private fun CaseTab(inputText: String, onResult: (String) -> Unit) {
    val cases = listOf(
        "UPPERCASE" to { s: String -> s.uppercase() },
        "lowercase" to { s: String -> s.lowercase() },
        "Title Case" to { s: String -> s.split(" ").joinToString(" ") { w -> w.lowercase().replaceFirstChar { it.uppercase() } } },
        "camelCase" to { s: String ->
            val words = s.trim().split(Regex("[\\s_\\-]+"))
            words.mapIndexed { i, w ->
                if (i == 0) w.lowercase() else w.lowercase().replaceFirstChar { it.uppercase() }
            }.joinToString("")
        },
        "snake_case" to { s: String ->
            s.trim().split(Regex("[\\s\\-]+")).joinToString("_") { it.lowercase() }
        },
        "kebab-case" to { s: String ->
            s.trim().split(Regex("[\\s_]+")).joinToString("-") { it.lowercase() }
        }
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Case Conversion", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        cases.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { (label, transform) ->
                    OutlinedButton(
                        onClick = { if (inputText.isNotEmpty()) onResult(transform(inputText)) },
                        modifier = Modifier.weight(1f)
                    ) { Text(label, fontSize = 12.sp) }
                }
                // pad row if odd
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Clean Tab
// ---------------------------------------------------------------------------

@Composable
private fun CleanTab(inputText: String, onResult: (String) -> Unit) {
    data class CleanOp(val label: String, val transform: (String) -> String)

    val ops = listOf(
        CleanOp("Remove Extra Spaces") { s ->
            s.lines().joinToString("\n") { it.replace(Regex("[ \\t]+"), " ").trim() }
        },
        CleanOp("Trim Lines") { s ->
            s.lines().joinToString("\n") { it.trim() }
        },
        CleanOp("Sort A-Z") { s ->
            s.lines().sorted().joinToString("\n")
        },
        CleanOp("Remove Duplicates") { s ->
            s.lines().distinct().joinToString("\n")
        },
        CleanOp("Remove Blank Lines") { s ->
            s.lines().filter { it.isNotBlank() }.joinToString("\n")
        },
        CleanOp("Reverse Lines") { s ->
            s.lines().reversed().joinToString("\n")
        }
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Clean & Transform", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        ops.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { op ->
                    OutlinedButton(
                        onClick = { if (inputText.isNotEmpty()) onResult(op.transform(inputText)) },
                        modifier = Modifier.weight(1f)
                    ) { Text(op.label, fontSize = 12.sp) }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Count Tab
// ---------------------------------------------------------------------------

@Composable
private fun CountTab(inputText: String) {
    val stats = remember(inputText) {
        computeStats(inputText)
    }

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Text Statistics", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Text(
            "(Updates automatically as you type)",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
        )

        val items = listOf(
            "Characters" to stats.chars.toString(),
            "Characters (no spaces)" to stats.charsNoSpaces.toString(),
            "Words" to stats.words.toString(),
            "Lines" to stats.lines.toString(),
            "Sentences" to stats.sentences.toString(),
            "Paragraphs" to stats.paragraphs.toString(),
            "Reading Time" to stats.readingTime,
            "Speaking Time" to stats.speakingTime
        )

        items.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { (label, value) ->
                    StatCard(label = label, value = value, modifier = Modifier.weight(1f))
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}

@Composable
private fun StatCard(label: String, value: String, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(0.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                value,
                fontWeight = FontWeight.Bold,
                fontSize = 22.sp,
                color = MaterialTheme.colorScheme.primary
            )
            Text(
                label,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

private data class TextStats(
    val chars: Int,
    val charsNoSpaces: Int,
    val words: Int,
    val lines: Int,
    val sentences: Int,
    val paragraphs: Int,
    val readingTime: String,
    val speakingTime: String
)

private fun computeStats(text: String): TextStats {
    if (text.isEmpty()) return TextStats(0, 0, 0, 0, 0, 0, "0 sec", "0 sec")
    val chars = text.length
    val charsNoSpaces = text.count { !it.isWhitespace() }
    val words = if (text.isBlank()) 0 else text.trim().split(Regex("\\s+")).size
    val lines = text.lines().size
    val sentences = text.split(Regex("[.!?]+")).count { it.isNotBlank() }
    val paragraphs = text.split(Regex("\\n\\s*\\n")).count { it.isNotBlank() }.coerceAtLeast(if (text.isNotBlank()) 1 else 0)
    val readingSeconds = (words / 3.0).toLong() // ~180 wpm
    val speakingSeconds = (words / 2.3).toLong() // ~140 wpm
    return TextStats(
        chars = chars,
        charsNoSpaces = charsNoSpaces,
        words = words,
        lines = lines,
        sentences = sentences,
        paragraphs = paragraphs,
        readingTime = formatDuration(readingSeconds),
        speakingTime = formatDuration(speakingSeconds)
    )
}

private fun formatDuration(seconds: Long): String = when {
    seconds < 60 -> "$seconds sec"
    seconds < 3600 -> "${seconds / 60} min ${seconds % 60} sec"
    else -> "${seconds / 3600} hr ${(seconds % 3600) / 60} min"
}

// ---------------------------------------------------------------------------
// Encode Tab
// ---------------------------------------------------------------------------

@Composable
private fun EncodeTab(inputText: String, onResult: (String) -> Unit) {
    data class EncodeOp(val label: String, val transform: (String) -> String)

    val ops = listOf(
        EncodeOp("Base64 Encode") { s ->
            try {
                Base64.encodeToString(s.toByteArray(StandardCharsets.UTF_8), Base64.NO_WRAP)
            } catch (e: Exception) { "Error: ${e.message}" }
        },
        EncodeOp("Base64 Decode") { s ->
            try {
                String(Base64.decode(s.trim(), Base64.NO_WRAP), StandardCharsets.UTF_8)
            } catch (e: Exception) { "Error: invalid Base64" }
        },
        EncodeOp("URL Encode") { s ->
            try {
                URLEncoder.encode(s, "UTF-8")
            } catch (e: Exception) { "Error: ${e.message}" }
        },
        EncodeOp("URL Decode") { s ->
            try {
                URLDecoder.decode(s, "UTF-8")
            } catch (e: Exception) { "Error: invalid URL encoding" }
        },
        EncodeOp("Hex Encode") { s ->
            s.toByteArray(StandardCharsets.UTF_8).joinToString("") { "%02x".format(it) }
        },
        EncodeOp("Hex Decode") { s ->
            try {
                val hex = s.replace(" ", "")
                val bytes = ByteArray(hex.length / 2) { i ->
                    hex.substring(i * 2, i * 2 + 2).toInt(16).toByte()
                }
                String(bytes, StandardCharsets.UTF_8)
            } catch (e: Exception) { "Error: invalid hex" }
        }
    )

    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Encode / Decode", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        ops.chunked(2).forEach { row ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { op ->
                    Button(
                        onClick = { if (inputText.isNotEmpty()) onResult(op.transform(inputText)) },
                        modifier = Modifier.weight(1f)
                    ) { Text(op.label, fontSize = 12.sp) }
                }
                if (row.size == 1) Spacer(Modifier.weight(1f))
            }
        }
    }
}
