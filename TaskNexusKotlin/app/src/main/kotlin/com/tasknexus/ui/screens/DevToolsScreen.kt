package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
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
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import org.json.JSONArray
import org.json.JSONObject
import org.json.JSONTokener
import java.security.MessageDigest
import java.util.UUID
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.graphics.lerp
import kotlin.math.cos
import kotlin.math.sin
import kotlin.math.PI

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DevToolsScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("JSON", "Color", "Regex", "UUID/Hash")

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
            Text(
                text = "Dev Tools",
                style = TextStyle(
                    color = OnSurface,
                    fontSize = 22.sp,
                    fontWeight = FontWeight.Bold
                )
            )
        }

        // Tab Row
        ScrollableTabRow(
            selectedTabIndex = selectedTab,
            containerColor = Surface,
            contentColor = Primary,
            edgePadding = 16.dp
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            color = if (selectedTab == index) Primary else OnSurface2,
                            fontWeight = if (selectedTab == index) FontWeight.SemiBold else FontWeight.Normal
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> JsonTab()
            1 -> ColorTab()
            2 -> RegexTab()
            3 -> UuidHashTab()
        }
    }
}

@Composable
private fun JsonTab() {
    var input by remember { mutableStateOf("") }
    var output by remember { mutableStateOf("") }
    var status by remember { mutableStateOf<Boolean?>(null) }
    val clipboard = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Input JSON", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                .padding(12.dp)
        ) {
            BasicTextField(
                value = input,
                onValueChange = { input = it },
                modifier = Modifier.fillMaxSize(),
                textStyle = TextStyle(
                    color = OnSurface,
                    fontSize = 13.sp,
                    fontFamily = FontFamily.Monospace
                ),
                cursorBrush = SolidColor(Primary),
                decorationBox = { inner ->
                    if (input.isEmpty()) Text(
                        "Paste JSON here...",
                        color = OnSurface3,
                        fontSize = 13.sp,
                        fontFamily = FontFamily.Monospace
                    )
                    inner()
                }
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            ToolButton("Format", modifier = Modifier.weight(1f)) {
                try {
                    val json = JSONTokener(input).nextValue()
                    output = when (json) {
                        is JSONObject -> json.toString(2)
                        is JSONArray -> json.toString(2)
                        else -> json.toString()
                    }
                    status = true
                } catch (e: Exception) {
                    output = "Error: ${e.message}"
                    status = false
                }
            }
            ToolButton("Minify", modifier = Modifier.weight(1f)) {
                try {
                    val json = JSONTokener(input).nextValue()
                    output = when (json) {
                        is JSONObject -> json.toString()
                        is JSONArray -> json.toString()
                        else -> json.toString()
                    }
                    status = true
                } catch (e: Exception) {
                    output = "Error: ${e.message}"
                    status = false
                }
            }
            ToolButton("Validate", modifier = Modifier.weight(1f)) {
                try {
                    JSONTokener(input).nextValue()
                    output = "Valid JSON"
                    status = true
                } catch (e: Exception) {
                    output = "Invalid: ${e.message}"
                    status = false
                }
            }
        }

        if (status != null) {
            AssistChip(
                onClick = {},
                label = { Text(if (status == true) "Valid" else "Invalid") },
                leadingIcon = {
                    Icon(
                        if (status == true) Icons.Default.CheckCircle else Icons.Default.Error,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                },
                colors = AssistChipDefaults.assistChipColors(
                    containerColor = if (status == true) Success.copy(alpha = 0.15f) else Danger.copy(alpha = 0.15f),
                    labelColor = if (status == true) Success else Danger,
                    leadingIconContentColor = if (status == true) Success else Danger
                )
            )
        }

        Text("Output", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Surface3)
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                .padding(12.dp)
        ) {
            Text(
                text = output.ifEmpty { "Output will appear here..." },
                color = if (output.isEmpty()) OnSurface3 else OnSurface,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.verticalScroll(rememberScrollState())
            )
        }

        if (output.isNotEmpty()) {
            OutlinedButton(
                onClick = { clipboard.setText(AnnotatedString(output)) },
                modifier = Modifier.align(Alignment.End),
                border = ButtonDefaults.outlinedButtonBorder.copy(),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
            ) {
                Icon(Icons.Default.ContentCopy, null, Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Copy")
            }
        }
    }
}

@Composable
private fun ColorTab() {
    var hue by remember { mutableStateOf(200f) }
    var saturation by remember { mutableStateOf(0.7f) }
    var value by remember { mutableStateOf(0.85f) }
    var parseInput by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    val color = hsvToColor(hue, saturation, value)
    val hex = colorToHex(color)
    val rgb = colorToRgb(color)
    val hsl = colorToHsl(color)
    val shades = generateShades(color)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Color Preview
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(100.dp)
                .clip(RoundedCornerShape(12.dp))
                .background(color)
        ) {
            Text(
                text = hex,
                color = if (value > 0.5f) Color.Black.copy(alpha = 0.7f) else Color.White.copy(alpha = 0.8f),
                modifier = Modifier.align(Alignment.Center),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                fontFamily = FontFamily.Monospace
            )
        }

        // HSV Sliders
        SliderRow("Hue", hue / 360f, "${hue.toInt()}°") { hue = it * 360f }
        SliderRow("Saturation", saturation, "${(saturation * 100).toInt()}%") { saturation = it }
        SliderRow("Value", value, "${(value * 100).toInt()}%") { value = it }

        // Color Values
        Text("Color Values", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        listOf(
            "HEX" to hex,
            "RGB" to rgb,
            "HSL" to hsl
        ).forEach { (label, val_) ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(8.dp))
                    .background(Surface2)
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(label, color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium, modifier = Modifier.width(40.dp))
                Text(val_, color = OnSurface, fontSize = 13.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f).padding(horizontal = 8.dp))
                IconButton(onClick = { clipboard.setText(AnnotatedString(val_)) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.ContentCopy, null, Modifier.size(16.dp), tint = OnSurface3)
                }
            }
        }

        // Shades
        Text("Shades", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            shades.forEach { shade ->
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(40.dp)
                        .clip(RoundedCornerShape(6.dp))
                        .background(shade)
                        .clickable { clipboard.setText(AnnotatedString(colorToHex(shade))) }
                )
            }
        }

        // Parse Input
        Text("Parse Color", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = parseInput,
                onValueChange = { parseInput = it },
                placeholder = { Text("#FF5733 or rgb(255,87,51)") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface
                )
            )
            Button(
                onClick = {
                    parseColorInput(parseInput)?.let { parsed ->
                        val hsv = FloatArray(3)
                        android.graphics.Color.RGBToHSV(
                            (parsed.red * 255).toInt(),
                            (parsed.green * 255).toInt(),
                            (parsed.blue * 255).toInt(),
                            hsv
                        )
                        hue = hsv[0]
                        saturation = hsv[1]
                        value = hsv[2]
                    }
                },
                colors = ButtonDefaults.buttonColors(containerColor = Primary)
            ) {
                Text("Parse")
            }
        }
    }
}

@Composable
private fun SliderRow(label: String, value: Float, display: String, onValueChange: (Float) -> Unit) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = OnSurface2, fontSize = 12.sp)
            Text(display, color = OnSurface, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
        }
        Slider(
            value = value,
            onValueChange = onValueChange,
            colors = SliderDefaults.colors(
                thumbColor = Primary,
                activeTrackColor = Primary,
                inactiveTrackColor = Surface3
            )
        )
    }
}

@Composable
private fun RegexTab() {
    var pattern by remember { mutableStateOf("") }
    var flags by remember { mutableStateOf("") }
    var testText by remember { mutableStateOf("") }
    var matchCount by remember { mutableStateOf(0) }
    var annotatedOutput by remember { mutableStateOf(AnnotatedString("")) }
    var error by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    val presets = listOf(
        "Email" to "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}",
        "URL" to "https?://[\\w\\-]+(\\.[\\w\\-]+)+([\\w.,@?^=%&:/~+#\\-]*[\\w@?^=%&/~+#\\-])?",
        "Phone" to "(\\+?\\d{1,3}[\\s\\-]?)?\\(?\\d{3}\\)?[\\s\\-]?\\d{3}[\\s\\-]?\\d{4}"
    )

    fun runRegex() {
        error = ""
        if (pattern.isEmpty() || testText.isEmpty()) {
            matchCount = 0
            annotatedOutput = AnnotatedString(testText)
            return
        }
        try {
            val opts = mutableSetOf<RegexOption>()
            if ("i" in flags) opts.add(RegexOption.IGNORE_CASE)
            if ("m" in flags) opts.add(RegexOption.MULTILINE)
            val regex = Regex(pattern, opts)
            val matches = regex.findAll(testText).toList()
            matchCount = matches.size

            val builder = AnnotatedString.Builder()
            var lastEnd = 0
            matches.forEach { match ->
                if (match.range.first > lastEnd) {
                    builder.append(testText.substring(lastEnd, match.range.first))
                }
                builder.withStyle(SpanStyle(background = Warning.copy(alpha = 0.3f), color = Warning)) {
                    append(match.value)
                }
                lastEnd = match.range.last + 1
            }
            if (lastEnd < testText.length) builder.append(testText.substring(lastEnd))
            annotatedOutput = builder.toAnnotatedString()
        } catch (e: Exception) {
            error = e.message ?: "Invalid pattern"
            matchCount = 0
            annotatedOutput = AnnotatedString(testText)
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Preset Patterns", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(presets) { (label, pat) ->
                FilterChip(
                    selected = pattern == pat,
                    onClick = { pattern = pat; runRegex() },
                    label = { Text(label) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Primary.copy(alpha = 0.15f),
                        selectedLabelColor = Primary
                    )
                )
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            OutlinedTextField(
                value = pattern,
                onValueChange = { pattern = it; runRegex() },
                placeholder = { Text("Pattern") },
                modifier = Modifier.weight(1f),
                singleLine = true,
                label = { Text("Pattern") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary,
                    unfocusedLabelColor = OnSurface3
                )
            )
            OutlinedTextField(
                value = flags,
                onValueChange = { flags = it; runRegex() },
                placeholder = { Text("im") },
                modifier = Modifier.width(80.dp),
                singleLine = true,
                label = { Text("Flags") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary,
                    unfocusedLabelColor = OnSurface3
                )
            )
        }

        if (error.isNotEmpty()) {
            Text(error, color = Danger, fontSize = 12.sp)
        }

        OutlinedTextField(
            value = testText,
            onValueChange = { testText = it; runRegex() },
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp),
            label = { Text("Test Text") },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary,
                unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface,
                unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary,
                unfocusedLabelColor = OnSurface3
            )
        )

        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            AssistChip(
                onClick = {},
                label = { Text("$matchCount match${if (matchCount != 1) "es" else ""}") },
                leadingIcon = {
                    Icon(Icons.Default.Search, null, Modifier.size(16.dp))
                },
                colors = AssistChipDefaults.assistChipColors(
                    containerColor = Info.copy(alpha = 0.15f),
                    labelColor = Info,
                    leadingIconContentColor = Info
                )
            )
        }

        Text("Matches Highlighted", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(160.dp)
                .clip(RoundedCornerShape(10.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                .padding(12.dp)
        ) {
            Text(
                text = annotatedOutput,
                fontSize = 13.sp,
                modifier = Modifier.verticalScroll(rememberScrollState())
            )
        }
    }
}

@Composable
private fun UuidHashTab() {
    var uuidCount by remember { mutableStateOf(1) }
    var generatedUuids by remember { mutableStateOf<List<String>>(emptyList()) }
    var hashInput by remember { mutableStateOf("") }
    var hashOutput by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // UUID Section
        Card(
            colors = CardDefaults.cardColors(containerColor = Surface2),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("UUID Generator", color = OnSurface, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text("Count: $uuidCount", color = OnSurface2, fontSize = 13.sp, modifier = Modifier.width(70.dp))
                    Slider(
                        value = uuidCount.toFloat(),
                        onValueChange = { uuidCount = it.toInt() },
                        valueRange = 1f..10f,
                        steps = 8,
                        modifier = Modifier.weight(1f),
                        colors = SliderDefaults.colors(thumbColor = Primary, activeTrackColor = Primary, inactiveTrackColor = Surface3)
                    )
                }

                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = { generatedUuids = List(uuidCount) { UUID.randomUUID().toString() } },
                        colors = ButtonDefaults.buttonColors(containerColor = Primary),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.Refresh, null, Modifier.size(16.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Generate")
                    }
                    if (generatedUuids.isNotEmpty()) {
                        OutlinedButton(
                            onClick = { clipboard.setText(AnnotatedString(generatedUuids.joinToString("\n"))) },
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
                        ) {
                            Icon(Icons.Default.ContentCopy, null, Modifier.size(16.dp))
                            Spacer(Modifier.width(6.dp))
                            Text("Copy All")
                        }
                    }
                }

                generatedUuids.forEach { uuid ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(6.dp))
                            .background(Surface3)
                            .padding(horizontal = 10.dp, vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(uuid, color = OnSurface, fontSize = 12.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                        IconButton(onClick = { clipboard.setText(AnnotatedString(uuid)) }, modifier = Modifier.size(28.dp)) {
                            Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp), tint = OnSurface3)
                        }
                    }
                }
            }
        }

        // Hash Section
        Card(
            colors = CardDefaults.cardColors(containerColor = Surface2),
            shape = RoundedCornerShape(12.dp)
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Text("SHA-256 Hash", color = OnSurface, fontSize = 15.sp, fontWeight = FontWeight.SemiBold)

                OutlinedTextField(
                    value = hashInput,
                    onValueChange = { hashInput = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Text to hash") },
                    minLines = 2,
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        unfocusedBorderColor = BorderColor,
                        focusedTextColor = OnSurface,
                        unfocusedTextColor = OnSurface,
                        focusedLabelColor = Primary,
                        unfocusedLabelColor = OnSurface3
                    )
                )

                Button(
                    onClick = {
                        if (hashInput.isNotEmpty()) {
                            val bytes = MessageDigest.getInstance("SHA-256").digest(hashInput.toByteArray())
                            hashOutput = bytes.joinToString("") { "%02x".format(it) }
                        }
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(Icons.Default.Tag, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Compute Hash")
                }

                if (hashOutput.isNotEmpty()) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(8.dp))
                            .background(Surface3)
                            .padding(12.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                            Text("SHA-256:", color = OnSurface2, fontSize = 11.sp)
                            Text(
                                hashOutput,
                                color = Success,
                                fontSize = 12.sp,
                                fontFamily = FontFamily.Monospace
                            )
                            TextButton(
                                onClick = { clipboard.setText(AnnotatedString(hashOutput)) },
                                colors = ButtonDefaults.textButtonColors(contentColor = Primary)
                            ) {
                                Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Copy Hash", fontSize = 12.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ToolButton(text: String, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Button(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.buttonColors(containerColor = Surface3),
        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
    ) {
        Text(text, color = OnSurface, fontSize = 13.sp)
    }
}

private fun hsvToColor(h: Float, s: Float, v: Float): Color {
    val androidColor = android.graphics.Color.HSVToColor(floatArrayOf(h, s, v))
    return Color(androidColor)
}

private fun colorToHex(color: Color): String {
    val r = (color.red * 255).toInt()
    val g = (color.green * 255).toInt()
    val b = (color.blue * 255).toInt()
    return "#%02X%02X%02X".format(r, g, b)
}

private fun colorToRgb(color: Color): String {
    val r = (color.red * 255).toInt()
    val g = (color.green * 255).toInt()
    val b = (color.blue * 255).toInt()
    return "rgb($r, $g, $b)"
}

private fun colorToHsl(color: Color): String {
    val r = color.red
    val g = color.green
    val b = color.blue
    val max = maxOf(r, g, b)
    val min = minOf(r, g, b)
    val l = (max + min) / 2f
    val d = max - min
    if (d == 0f) return "hsl(0, 0%, ${(l * 100).toInt()}%)"
    val s = if (l > 0.5f) d / (2f - max - min) else d / (max + min)
    val h = when (max) {
        r -> ((g - b) / d + (if (g < b) 6f else 0f)) / 6f
        g -> ((b - r) / d + 2f) / 6f
        else -> ((r - g) / d + 4f) / 6f
    }
    return "hsl(${(h * 360).toInt()}, ${(s * 100).toInt()}%, ${(l * 100).toInt()}%)"
}

private fun generateShades(color: Color): List<Color> {
    return (1..7).map { i ->
        val t = i / 8f
        lerp(Color.Black, color, t * 1.5f).copy(alpha = 1f)
    }
}

private fun parseColorInput(input: String): Color? {
    return try {
        when {
            input.startsWith("#") -> {
                val hex = input.removePrefix("#")
                val argb = if (hex.length == 6) "FF$hex" else hex
                Color(java.lang.Long.parseLong(argb, 16).toInt())
            }
            input.startsWith("rgb") -> {
                val nums = input.filter { it.isDigit() || it == ',' || it == ' ' }
                    .split(",").map { it.trim().toIntOrNull() ?: 0 }
                if (nums.size >= 3) Color(nums[0], nums[1], nums[2]) else null
            }
            else -> null
        }
    } catch (e: Exception) { null }
}
