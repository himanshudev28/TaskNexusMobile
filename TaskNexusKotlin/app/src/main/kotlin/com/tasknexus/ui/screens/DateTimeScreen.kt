package com.tasknexus.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
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
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import java.text.SimpleDateFormat
import java.time.*
import java.time.format.DateTimeFormatter
import java.time.format.TextStyle
import java.time.temporal.ChronoUnit
import java.util.*

// ---------------------------------------------------------------------------
// DateTimeScreen
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DateTimeScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("World Clock", "Calculator", "Timestamps")

    Column(modifier = Modifier.fillMaxSize()) {
        TabRow(selectedTabIndex = selectedTab) {
            tabs.forEachIndexed { index, title ->
                Tab(
                    selected = selectedTab == index,
                    onClick = { selectedTab = index },
                    text = { Text(title) }
                )
            }
        }
        when (selectedTab) {
            0 -> WorldClockTab()
            1 -> DateCalculatorTab()
            2 -> TimestampsTab()
        }
    }
}

// ---------------------------------------------------------------------------
// World Clock Tab
// ---------------------------------------------------------------------------

private data class CityZone(val city: String, val zoneId: String, val flag: String)

private val WORLD_CITIES = listOf(
    CityZone("New York", "America/New_York", "🇺🇸"),
    CityZone("London", "Europe/London", "🇬🇧"),
    CityZone("Dubai", "Asia/Dubai", "🇦🇪"),
    CityZone("Tokyo", "Asia/Tokyo", "🇯🇵"),
    CityZone("Sydney", "Australia/Sydney", "🇦🇺"),
    CityZone("Los Angeles", "America/Los_Angeles", "🇺🇸")
)

@Composable
private fun WorldClockTab() {
    var now by remember { mutableStateOf(Instant.now()) }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            now = Instant.now()
        }
    }

    val localTime = remember(now) {
        ZonedDateTime.ofInstant(now, ZoneId.systemDefault())
    }
    val timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss")
    val dateFormatter = DateTimeFormatter.ofPattern("EEE, MMM d")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Local time hero display
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ),
            elevation = CardDefaults.cardElevation(4.dp)
        ) {
            Column(
                modifier = Modifier.padding(20.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    "Local Time",
                    style = MaterialTheme.typography.labelLarge,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    localTime.format(timeFormatter),
                    fontSize = 56.sp,
                    fontWeight = FontWeight.Bold,
                    fontFamily = FontFamily.Monospace,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    localTime.format(dateFormatter),
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onPrimaryContainer
                )
                Text(
                    ZoneId.systemDefault().getDisplayName(TextStyle.FULL, Locale.getDefault()),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                )
            }
        }

        Text("World Cities", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

        WORLD_CITIES.forEach { cityZone ->
            val cityTime = remember(now) {
                ZonedDateTime.ofInstant(now, ZoneId.of(cityZone.zoneId))
            }
            val offsetHours = cityTime.offset.totalSeconds / 3600
            val offsetStr = if (offsetHours >= 0) "UTC+$offsetHours" else "UTC$offsetHours"

            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(1.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(cityZone.flag, fontSize = 28.sp)
                    Spacer(Modifier.width(12.dp))
                    Column(modifier = Modifier.weight(1f)) {
                        Text(cityZone.city, fontWeight = FontWeight.SemiBold)
                        Text(
                            "${cityTime.format(dateFormatter)} · $offsetStr",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                        )
                    }
                    Text(
                        cityTime.format(timeFormatter),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold
                    )
                }
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Date Calculator Tab
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DateCalculatorTab() {
    var fromDate by remember { mutableStateOf(LocalDate.now().minusDays(30)) }
    var toDate by remember { mutableStateOf(LocalDate.now()) }
    var showFromPicker by remember { mutableStateOf(false) }
    var showToPicker by remember { mutableStateOf(false) }

    var addBaseDate by remember { mutableStateOf(LocalDate.now()) }
    var addDaysInput by remember { mutableStateOf("7") }
    var showAddBasePicker by remember { mutableStateOf(false) }
    var addResult by remember { mutableStateOf<LocalDate?>(null) }
    var subtractMode by remember { mutableStateOf(false) }

    val daysBetween = remember(fromDate, toDate) { ChronoUnit.DAYS.between(fromDate, toDate) }
    val weeksBetween = remember(daysBetween) { daysBetween / 7 }
    val monthsBetween = remember(fromDate, toDate) { ChronoUnit.MONTHS.between(fromDate, toDate) }

    val displayFormatter = DateTimeFormatter.ofPattern("MMM d, yyyy")

    // Date picker states
    val fromPickerState = rememberDatePickerState(
        initialSelectedDateMillis = fromDate.toEpochDay() * 86400000L
    )
    val toPickerState = rememberDatePickerState(
        initialSelectedDateMillis = toDate.toEpochDay() * 86400000L
    )
    val addBasePickerState = rememberDatePickerState(
        initialSelectedDateMillis = addBaseDate.toEpochDay() * 86400000L
    )

    if (showFromPicker) {
        DatePickerDialog(
            onDismissRequest = { showFromPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    fromPickerState.selectedDateMillis?.let {
                        fromDate = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).toLocalDate()
                    }
                    showFromPicker = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { showFromPicker = false }) { Text("Cancel") } }
        ) { DatePicker(state = fromPickerState) }
    }
    if (showToPicker) {
        DatePickerDialog(
            onDismissRequest = { showToPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    toPickerState.selectedDateMillis?.let {
                        toDate = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).toLocalDate()
                    }
                    showToPicker = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { showToPicker = false }) { Text("Cancel") } }
        ) { DatePicker(state = toPickerState) }
    }
    if (showAddBasePicker) {
        DatePickerDialog(
            onDismissRequest = { showAddBasePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    addBasePickerState.selectedDateMillis?.let {
                        addBaseDate = Instant.ofEpochMilli(it).atZone(ZoneId.systemDefault()).toLocalDate()
                    }
                    showAddBasePicker = false
                }) { Text("OK") }
            },
            dismissButton = { TextButton(onClick = { showAddBasePicker = false }) { Text("Cancel") } }
        ) { DatePicker(state = addBasePickerState) }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Difference section
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Date Difference", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { showFromPicker = true },
                        modifier = Modifier.weight(1f)
                    ) { Text(fromDate.format(displayFormatter), maxLines = 1) }

                    Text("to", modifier = Modifier.align(Alignment.CenterVertically))

                    OutlinedButton(
                        onClick = { showToPicker = true },
                        modifier = Modifier.weight(1f)
                    ) { Text(toDate.format(displayFormatter), maxLines = 1) }
                }

                Surface(
                    color = MaterialTheme.colorScheme.secondaryContainer,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        DiffChip("$daysBetween", "days")
                        DiffChip("$weeksBetween", "weeks")
                        DiffChip("$monthsBetween", "months")
                    }
                }
            }
        }

        // Add/Subtract section
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Text("Add / Subtract Days", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)

                OutlinedButton(
                    onClick = { showAddBasePicker = true },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Base date: ${addBaseDate.format(displayFormatter)}") }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = addDaysInput,
                        onValueChange = { addDaysInput = it.filter { c -> c.isDigit() } },
                        label = { Text("Days") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        modifier = Modifier.weight(1f),
                        singleLine = true
                    )
                    Column(modifier = Modifier.weight(1f)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = !subtractMode, onClick = { subtractMode = false })
                            Text("Add")
                        }
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            RadioButton(selected = subtractMode, onClick = { subtractMode = true })
                            Text("Subtract")
                        }
                    }
                }

                Button(
                    onClick = {
                        val days = addDaysInput.toLongOrNull() ?: return@Button
                        addResult = if (subtractMode) addBaseDate.minusDays(days) else addBaseDate.plusDays(days)
                    },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Calculate") }

                addResult?.let { result ->
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer,
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Column(modifier = Modifier.padding(12.dp)) {
                            Text("Result", style = MaterialTheme.typography.labelSmall)
                            Text(
                                result.format(displayFormatter),
                                style = MaterialTheme.typography.headlineSmall,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DiffChip(value: String, label: String) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold,
            color = MaterialTheme.colorScheme.onSecondaryContainer)
        Text(label, style = MaterialTheme.typography.labelSmall,
            color = MaterialTheme.colorScheme.onSecondaryContainer)
    }
}

// ---------------------------------------------------------------------------
// Timestamps Tab
// ---------------------------------------------------------------------------

@Composable
private fun TimestampsTab() {
    val clipboardManager = LocalClipboardManager.current
    var currentUnix by remember { mutableLongStateOf(System.currentTimeMillis() / 1000L) }
    var unixInput by remember { mutableStateOf("") }
    var unixToHumanResult by remember { mutableStateOf("") }
    var dateInput by remember { mutableStateOf("") }
    var humanToUnixResult by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        while (true) {
            delay(1000L)
            currentUnix = System.currentTimeMillis() / 1000L
        }
    }

    val sdfPatterns = listOf(
        "yyyy-MM-dd HH:mm:ss",
        "yyyy-MM-dd",
        "MM/dd/yyyy HH:mm:ss",
        "MM/dd/yyyy",
        "dd-MM-yyyy HH:mm:ss"
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Live timestamp
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Current Unix Timestamp", style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onPrimaryContainer)
                    Text(
                        currentUnix.toString(),
                        fontFamily = FontFamily.Monospace,
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                }
                IconButton(onClick = { clipboardManager.setText(AnnotatedString(currentUnix.toString())) }) {
                    Icon(Icons.Default.ContentCopy, contentDescription = "Copy",
                        tint = MaterialTheme.colorScheme.onPrimaryContainer)
                }
            }
        }

        // Unix → Human
        Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(2.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Unix → Human Readable", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = unixInput,
                    onValueChange = { unixInput = it },
                    label = { Text("Unix timestamp (seconds)") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Button(
                    onClick = {
                        val ts = unixInput.toLongOrNull()
                        unixToHumanResult = if (ts != null) {
                            try {
                                val instant = Instant.ofEpochSecond(ts)
                                val zdt = ZonedDateTime.ofInstant(instant, ZoneId.systemDefault())
                                DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' HH:mm:ss z").format(zdt)
                            } catch (e: Exception) { "Invalid timestamp" }
                        } else "Invalid input"
                    },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Convert") }
                if (unixToHumanResult.isNotEmpty()) {
                    ResultSurface(unixToHumanResult) {
                        clipboardManager.setText(AnnotatedString(unixToHumanResult))
                    }
                }
            }
        }

        // Human → Unix
        Card(modifier = Modifier.fillMaxWidth(), elevation = CardDefaults.cardElevation(2.dp)) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("Date → Unix Timestamp", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                OutlinedTextField(
                    value = dateInput,
                    onValueChange = { dateInput = it },
                    label = { Text("e.g. 2024-01-15 14:30:00") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                Text(
                    "Supported: yyyy-MM-dd HH:mm:ss, yyyy-MM-dd, MM/dd/yyyy",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)
                )
                Button(
                    onClick = {
                        var parsed: Long? = null
                        for (pattern in sdfPatterns) {
                            try {
                                val sdf = SimpleDateFormat(pattern, Locale.getDefault())
                                sdf.isLenient = false
                                val date = sdf.parse(dateInput.trim())
                                if (date != null) { parsed = date.time / 1000L; break }
                            } catch (_: Exception) {}
                        }
                        humanToUnixResult = parsed?.toString() ?: "Could not parse date"
                    },
                    modifier = Modifier.fillMaxWidth()
                ) { Text("Convert") }
                if (humanToUnixResult.isNotEmpty()) {
                    ResultSurface(humanToUnixResult) {
                        clipboardManager.setText(AnnotatedString(humanToUnixResult))
                    }
                }
            }
        }
    }
}

@Composable
private fun ResultSurface(text: String, onCopy: () -> Unit) {
    Surface(
        color = MaterialTheme.colorScheme.surfaceVariant,
        shape = MaterialTheme.shapes.small,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text,
                fontFamily = FontFamily.Monospace,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium
            )
            IconButton(onClick = onCopy) {
                Icon(Icons.Default.ContentCopy, contentDescription = "Copy")
            }
        }
    }
}
