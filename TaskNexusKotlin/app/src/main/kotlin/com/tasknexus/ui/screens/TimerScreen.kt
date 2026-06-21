package com.tasknexus.ui.screens

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Pause
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.delay

// ─────────────────────────────────────────────────────────────────────────────
// TimerScreen
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun TimerScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Stopwatch", "Countdown", "Pomodoro")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Surface2,
            contentColor = Primary
        ) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                            )
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> StopwatchTab()
            1 -> CountdownTab()
            2 -> PomodoroTab()
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Stopwatch Tab
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun StopwatchTab() {
    var running by remember { mutableStateOf(false) }
    var elapsedCs by remember { mutableLongStateOf(0L) } // centiseconds
    val laps = remember { mutableStateListOf<Long>() }

    LaunchedEffect(running) {
        if (running) {
            val start = System.currentTimeMillis() - elapsedCs * 10L
            while (running) {
                elapsedCs = (System.currentTimeMillis() - start) / 10L
                delay(10)
            }
        }
    }

    fun formatTime(cs: Long): String {
        val h = cs / 360000
        val m = (cs % 360000) / 6000
        val s = (cs % 6000) / 100
        val c = cs % 100
        return "%02d:%02d:%02d.%02d".format(h, m, s, c)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(32.dp))

        // Large time display
        Text(
            text = formatTime(elapsedCs),
            fontFamily = FontFamily.Monospace,
            fontSize = 52.sp,
            fontWeight = FontWeight.Light,
            color = OnSurface,
            textAlign = TextAlign.Center
        )

        Spacer(Modifier.height(40.dp))

        // Control buttons
        Row(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Reset
            OutlinedButton(
                onClick = {
                    running = false
                    elapsedCs = 0L
                    laps.clear()
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface2)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Reset", modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Reset")
            }

            // Start / Pause
            Button(
                onClick = { running = !running },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (running) Warning else Primary
                ),
                modifier = Modifier.size(72.dp)
            ) {
                Icon(
                    if (running) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (running) "Pause" else "Start",
                    modifier = Modifier.size(32.dp)
                )
            }

            // Lap
            OutlinedButton(
                onClick = { if (running || elapsedCs > 0) laps.add(0, elapsedCs) },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Info)
            ) {
                Icon(Icons.Default.Timer, contentDescription = "Lap", modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Lap")
            }
        }

        Spacer(Modifier.height(24.dp))

        // Laps list
        if (laps.isNotEmpty()) {
            HorizontalDivider(color = BorderColor)
            Spacer(Modifier.height(8.dp))
            Text(
                "Laps",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = OnSurface2
                ),
                modifier = Modifier.align(Alignment.Start)
            )
            Spacer(Modifier.height(8.dp))
            LazyColumn(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                itemsIndexed(laps) { index, lapCs ->
                    val lapNumber = laps.size - index
                    val lapDiff = if (index < laps.size - 1) lapCs - laps[index + 1] else lapCs
                    ElevatedCard(
                        colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                "Lap $lapNumber",
                                style = MaterialTheme.typography.labelLarge.copy(color = OnSurface2)
                            )
                            Text(
                                "+${formatTime(lapDiff)}",
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.bodyMedium.copy(color = Info)
                            )
                            Text(
                                formatTime(lapCs),
                                fontFamily = FontFamily.Monospace,
                                style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface)
                            )
                        }
                    }
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown Tab
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun CountdownTab() {
    var running by remember { mutableStateOf(false) }
    var totalSeconds by remember { mutableLongStateOf(300L) }
    var remainingSeconds by remember { mutableLongStateOf(300L) }
    var hourInput by remember { mutableStateOf("0") }
    var minuteInput by remember { mutableStateOf("5") }
    var secondInput by remember { mutableStateOf("0") }

    val presets = listOf(60L to "1m", 300L to "5m", 600L to "10m", 900L to "15m", 1500L to "25m")

    LaunchedEffect(running) {
        if (running) {
            val endTime = System.currentTimeMillis() + remainingSeconds * 1000L
            while (running && remainingSeconds > 0) {
                delay(100)
                remainingSeconds = maxOf(0, (endTime - System.currentTimeMillis()) / 1000L)
                if (remainingSeconds == 0L) running = false
            }
        }
    }

    fun applyInputs() {
        val h = hourInput.toLongOrNull() ?: 0L
        val m = minuteInput.toLongOrNull() ?: 0L
        val s = secondInput.toLongOrNull() ?: 0L
        totalSeconds = h * 3600 + m * 60 + s
        remainingSeconds = totalSeconds
    }

    fun formatCountdown(sec: Long): String {
        val h = sec / 3600
        val m = (sec % 3600) / 60
        val s = sec % 60
        return if (h > 0) "%02d:%02d:%02d".format(h, m, s)
        else "%02d:%02d".format(m, s)
    }

    val progress = if (totalSeconds > 0) remainingSeconds.toFloat() / totalSeconds.toFloat() else 0f

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))

        // Preset chips
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically
        ) {
            presets.forEach { (secs, label) ->
                FilterChip(
                    selected = totalSeconds == secs && remainingSeconds == secs,
                    onClick = {
                        running = false
                        totalSeconds = secs
                        remainingSeconds = secs
                        val h = secs / 3600
                        val m = (secs % 3600) / 60
                        val s = secs % 60
                        hourInput = h.toString()
                        minuteInput = m.toString()
                        secondInput = s.toString()
                    },
                    label = { Text(label, style = MaterialTheme.typography.labelMedium) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Primary,
                        selectedLabelColor = Color.White
                    )
                )
            }
        }

        Spacer(Modifier.height(24.dp))

        // Circular progress with time
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(220.dp)) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val stroke = 16.dp.toPx()
                val inset = stroke / 2
                drawArc(
                    color = Surface4,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = Size(size.width - stroke, size.height - stroke),
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                drawArc(
                    color = if (remainingSeconds > totalSeconds * 0.2f) Primary else Danger,
                    startAngle = -90f,
                    sweepAngle = 360f * progress,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = Size(size.width - stroke, size.height - stroke),
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
            Text(
                text = formatCountdown(remainingSeconds),
                fontFamily = FontFamily.Monospace,
                fontSize = 40.sp,
                fontWeight = FontWeight.Light,
                color = OnSurface
            )
        }

        Spacer(Modifier.height(24.dp))

        // H / M / S inputs
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            listOf(
                Triple("h", hourInput) { v: String -> hourInput = v },
                Triple("m", minuteInput) { v: String -> minuteInput = v },
                Triple("s", secondInput) { v: String -> secondInput = v }
            ).forEach { (label, value, onValueChange) ->
                OutlinedTextField(
                    value = value,
                    onValueChange = { new ->
                        if (new.length <= 2 && (new.isEmpty() || new.all { it.isDigit() })) {
                            onValueChange(new)
                            if (!running) applyInputs()
                        }
                    },
                    label = { Text(label) },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary,
                        unfocusedBorderColor = BorderColor,
                        focusedLabelColor = Primary,
                        cursorColor = Primary,
                        focusedTextColor = OnSurface,
                        unfocusedTextColor = OnSurface
                    )
                )
            }
        }

        Spacer(Modifier.height(24.dp))

        // Buttons
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OutlinedButton(
                onClick = {
                    running = false
                    remainingSeconds = totalSeconds
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface2)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Reset", modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Reset")
            }

            Button(
                onClick = {
                    if (remainingSeconds > 0) running = !running
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (running) Warning else Primary
                )
            ) {
                Icon(
                    if (running) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (running) "Pause" else "Start",
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(if (running) "Pause" else "Start")
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Pomodoro Tab
// ─────────────────────────────────────────────────────────────────────────────

private enum class PomodoroPhase(val label: String, val durationSec: Long, val color: Color) {
    WORK("Work", 25 * 60L, Color(0xFF4F46E5)),
    SHORT_BREAK("Short Break", 5 * 60L, Color(0xFF22C55E)),
    LONG_BREAK("Long Break", 15 * 60L, Color(0xFF3B82F6))
}

@Composable
private fun PomodoroTab() {
    var phase by remember { mutableStateOf(PomodoroPhase.WORK) }
    var running by remember { mutableStateOf(false) }
    var remainingSeconds by remember { mutableLongStateOf(phase.durationSec) }

    LaunchedEffect(phase) {
        running = false
        remainingSeconds = phase.durationSec
    }

    LaunchedEffect(running) {
        if (running) {
            val endTime = System.currentTimeMillis() + remainingSeconds * 1000L
            while (running && remainingSeconds > 0) {
                delay(100)
                remainingSeconds = maxOf(0, (endTime - System.currentTimeMillis()) / 1000L)
                if (remainingSeconds == 0L) running = false
            }
        }
    }

    val progress = if (phase.durationSec > 0) remainingSeconds.toFloat() / phase.durationSec.toFloat() else 0f

    fun formatTime(sec: Long): String {
        val m = sec / 60
        val s = sec % 60
        return "%02d:%02d".format(m, s)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Spacer(Modifier.height(16.dp))

        // Phase selector
        SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
            PomodoroPhase.entries.forEachIndexed { index, p ->
                SegmentedButton(
                    selected = phase == p,
                    onClick = { phase = p },
                    shape = SegmentedButtonDefaults.itemShape(index = index, count = PomodoroPhase.entries.size),
                    colors = SegmentedButtonDefaults.colors(
                        activeContainerColor = p.color,
                        activeContentColor = Color.White
                    )
                ) {
                    Text(
                        p.label,
                        style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.SemiBold)
                    )
                }
            }
        }

        Spacer(Modifier.height(32.dp))

        // Circular progress
        Box(contentAlignment = Alignment.Center, modifier = Modifier.size(240.dp)) {
            Canvas(modifier = Modifier.fillMaxSize()) {
                val stroke = 18.dp.toPx()
                val inset = stroke / 2
                drawArc(
                    color = Surface4,
                    startAngle = -90f,
                    sweepAngle = 360f,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = Size(size.width - stroke, size.height - stroke),
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
                drawArc(
                    color = phase.color,
                    startAngle = -90f,
                    sweepAngle = 360f * progress,
                    useCenter = false,
                    topLeft = Offset(inset, inset),
                    size = Size(size.width - stroke, size.height - stroke),
                    style = Stroke(width = stroke, cap = StrokeCap.Round)
                )
            }
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Text(
                    text = phase.label,
                    style = MaterialTheme.typography.labelLarge.copy(color = phase.color)
                )
                Spacer(Modifier.height(4.dp))
                Text(
                    text = formatTime(remainingSeconds),
                    fontFamily = FontFamily.Monospace,
                    fontSize = 44.sp,
                    fontWeight = FontWeight.Light,
                    color = OnSurface
                )
            }
        }

        Spacer(Modifier.height(32.dp))

        // Buttons
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            OutlinedButton(
                onClick = {
                    running = false
                    remainingSeconds = phase.durationSec
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface2)
            ) {
                Icon(Icons.Default.Refresh, contentDescription = "Reset", modifier = Modifier.size(18.dp))
                Spacer(Modifier.width(6.dp))
                Text("Reset")
            }

            Button(
                onClick = {
                    if (remainingSeconds > 0) running = !running
                },
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = if (running) Warning else phase.color
                )
            ) {
                Icon(
                    if (running) Icons.Default.Pause else Icons.Default.PlayArrow,
                    contentDescription = if (running) "Pause" else "Start",
                    modifier = Modifier.size(20.dp)
                )
                Spacer(Modifier.width(6.dp))
                Text(if (running) "Pause" else "Start")
            }
        }

        Spacer(Modifier.height(24.dp))

        // Phase duration info chips
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            PomodoroPhase.entries.forEach { p ->
                SuggestionChip(
                    onClick = { phase = p },
                    label = {
                        Text(
                            "${p.label}: ${p.durationSec / 60}m",
                            style = MaterialTheme.typography.labelSmall.copy(color = p.color)
                        )
                    },
                    colors = SuggestionChipDefaults.suggestionChipColors(containerColor = Surface3),
                    border = SuggestionChipDefaults.suggestionChipBorder(
                        enabled = true,
                        borderColor = p.color.copy(alpha = 0.4f)
                    )
                )
            }
        }
    }
}
