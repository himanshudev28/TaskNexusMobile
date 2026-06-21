package com.tasknexus.ui.screens

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ContentCopy
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import java.util.UUID
import kotlin.random.Random

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

private const val UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
private const val LOWER = "abcdefghijklmnopqrstuvwxyz"
private const val DIGITS = "0123456789"
private const val SYMBOLS = "!@#\$%^&*()-_=+[]{}|;:,.<>?"

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

private fun generatePassword(
    length: Int,
    useUpper: Boolean,
    useLower: Boolean,
    useNumbers: Boolean,
    useSymbols: Boolean
): String {
    val pool = buildString {
        if (useUpper) append(UPPER)
        if (useLower) append(LOWER)
        if (useNumbers) append(DIGITS)
        if (useSymbols) append(SYMBOLS)
    }
    if (pool.isEmpty()) return ""
    return (1..length).map { pool[Random.nextInt(pool.length)] }.joinToString("")
}

private fun passwordStrength(
    password: String,
    useUpper: Boolean,
    useLower: Boolean,
    useNumbers: Boolean,
    useSymbols: Boolean
): Float {
    if (password.isEmpty()) return 0f
    var score = 0
    if (useUpper) score++
    if (useLower) score++
    if (useNumbers) score++
    if (useSymbols) score++
    val lengthScore = when {
        password.length >= 32 -> 3
        password.length >= 16 -> 2
        password.length >= 12 -> 1
        else -> 0
    }
    return ((score + lengthScore).coerceAtMost(7) / 7f)
}

private fun strengthLabel(strength: Float): String = when {
    strength < 0.25f -> "Weak"
    strength < 0.5f -> "Fair"
    strength < 0.75f -> "Good"
    else -> "Strong"
}

private fun strengthColor(strength: Float): Color = when {
    strength < 0.25f -> Color(0xFFD32F2F)
    strength < 0.5f -> Color(0xFFF57C00)
    strength < 0.75f -> Color(0xFFFBC02D)
    else -> Color(0xFF388E3C)
}

private fun generateRandomString(length: Int = 32): String {
    val chars = UPPER + LOWER + DIGITS
    return (1..length).map { chars[Random.nextInt(chars.length)] }.joinToString("")
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

@Composable
fun GeneratorsScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Generators", fontSize = 24.sp, fontWeight = FontWeight.Bold)
        PasswordGeneratorCard()
        UUIDGeneratorCard()
    }
}

// ---------------------------------------------------------------------------
// Password Generator Card
// ---------------------------------------------------------------------------

@Composable
private fun PasswordGeneratorCard() {
    val clipboardManager = LocalClipboardManager.current
    var length by remember { mutableFloatStateOf(16f) }
    var useUpper by remember { mutableStateOf(true) }
    var useLower by remember { mutableStateOf(true) }
    var useNumbers by remember { mutableStateOf(true) }
    var useSymbols by remember { mutableStateOf(false) }
    var password by remember { mutableStateOf("") }
    var copied by remember { mutableStateOf(false) }

    val strength = remember(password, useUpper, useLower, useNumbers, useSymbols) {
        passwordStrength(password, useUpper, useLower, useNumbers, useSymbols)
    }

    LaunchedEffect(Unit) {
        password = generatePassword(length.toInt(), useUpper, useLower, useNumbers, useSymbols)
    }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Password Generator", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

            // Length slider
            Text("Length: ${length.toInt()}", style = MaterialTheme.typography.bodyMedium)
            Slider(
                value = length,
                onValueChange = { length = it },
                valueRange = 8f..64f,
                steps = 55,
                modifier = Modifier.fillMaxWidth()
            )

            // Checkboxes in 2x2 grid
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    CheckboxRow("Uppercase (A-Z)", useUpper) { useUpper = it }
                    CheckboxRow("Numbers (0-9)", useNumbers) { useNumbers = it }
                }
                Column(modifier = Modifier.weight(1f)) {
                    CheckboxRow("Lowercase (a-z)", useLower) { useLower = it }
                    CheckboxRow("Symbols (!@#)", useSymbols) { useSymbols = it }
                }
            }

            // Generated password display
            OutlinedTextField(
                value = password,
                onValueChange = {},
                readOnly = true,
                modifier = Modifier.fillMaxWidth(),
                textStyle = LocalTextStyle.current.copy(
                    fontFamily = FontFamily.Monospace,
                    fontSize = 14.sp
                ),
                label = { Text("Generated Password") },
                minLines = 2
            )

            // Strength indicator
            if (password.isNotEmpty()) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    LinearProgressIndicator(
                        progress = { strength },
                        modifier = Modifier.weight(1f).height(8.dp),
                        color = strengthColor(strength),
                        trackColor = MaterialTheme.colorScheme.surfaceVariant
                    )
                    Text(
                        strengthLabel(strength),
                        style = MaterialTheme.typography.labelMedium,
                        color = strengthColor(strength),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = {
                        copied = false
                        password = generatePassword(length.toInt(), useUpper, useLower, useNumbers, useSymbols)
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Refresh, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text("Generate")
                }
                OutlinedButton(
                    onClick = {
                        if (password.isNotEmpty()) {
                            clipboardManager.setText(AnnotatedString(password))
                            copied = true
                        }
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text(if (copied) "Copied!" else "Copy")
                }
            }
        }
    }
}

@Composable
private fun CheckboxRow(label: String, checked: Boolean, onCheckedChange: (Boolean) -> Unit) {
    Row(
        verticalAlignment = Alignment.CenterVertically,
        modifier = Modifier.padding(vertical = 2.dp)
    ) {
        Checkbox(checked = checked, onCheckedChange = onCheckedChange)
        Text(label, style = MaterialTheme.typography.bodySmall)
    }
}

// ---------------------------------------------------------------------------
// UUID Generator Card
// ---------------------------------------------------------------------------

private enum class UUIDCount(val label: String, val count: Int) {
    ONE("1", 1), FIVE("5", 5), TEN("10", 10), FIFTY("50", 50)
}

private enum class UUIDType(val label: String) {
    UUID_V4("UUID v4"), RANDOM_STRING("Random String")
}

@Composable
private fun UUIDGeneratorCard() {
    val clipboardManager = LocalClipboardManager.current
    var selectedCount by remember { mutableStateOf(UUIDCount.ONE) }
    var selectedType by remember { mutableStateOf(UUIDType.UUID_V4) }
    var results by remember { mutableStateOf(listOf<String>()) }
    var copied by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("UUID / ID Generator", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)

            // Count selector
            Text("Count", style = MaterialTheme.typography.labelMedium)
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                UUIDCount.values().forEach { count ->
                    FilterChip(
                        selected = selectedCount == count,
                        onClick = { selectedCount = count; results = listOf(); copied = false },
                        label = { Text(count.label) }
                    )
                }
            }

            // Type selector
            Text("Type", style = MaterialTheme.typography.labelMedium)
            Row(
                modifier = Modifier.horizontalScroll(rememberScrollState()),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                UUIDType.values().forEach { type ->
                    FilterChip(
                        selected = selectedType == type,
                        onClick = { selectedType = type; results = listOf(); copied = false },
                        label = { Text(type.label) }
                    )
                }
            }

            Button(
                onClick = {
                    copied = false
                    results = (1..selectedCount.count).map {
                        when (selectedType) {
                            UUIDType.UUID_V4 -> UUID.randomUUID().toString()
                            UUIDType.RANDOM_STRING -> generateRandomString(32)
                        }
                    }
                },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.Refresh, contentDescription = null)
                Spacer(Modifier.width(4.dp))
                Text("Generate")
            }

            if (results.isNotEmpty()) {
                Surface(
                    color = MaterialTheme.colorScheme.surfaceVariant,
                    shape = MaterialTheme.shapes.small,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        results.forEach { id ->
                            Text(
                                id,
                                fontFamily = FontFamily.Monospace,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(vertical = 2.dp)
                            )
                        }
                    }
                }

                OutlinedButton(
                    onClick = {
                        clipboardManager.setText(AnnotatedString(results.joinToString("\n")))
                        copied = true
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.ContentCopy, contentDescription = null)
                    Spacer(Modifier.width(4.dp))
                    Text(if (copied) "Copied All!" else "Copy All")
                }
            }
        }
    }
}
