package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.tasknexus.data.entity.Reminder
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.ReminderViewModel
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RemindersScreen(navController: NavController) {
    val viewModel: ReminderViewModel = viewModel()
    val reminders by viewModel.uiState.collectAsState()

    var reminderText by remember { mutableStateOf("") }
    var selectedDateTime by remember { mutableStateOf("") }
    var showDatePicker by remember { mutableStateOf(false) }
    var showTimePicker by remember { mutableStateOf(false) }
    var pickedDateMillis by remember { mutableStateOf<Long?>(null) }
    var pickedHour by remember { mutableStateOf(9) }
    var pickedMinute by remember { mutableStateOf(0) }

    val nowIso = remember {
        SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).format(Date())
    }

    val pastDue = remember(reminders) {
        reminders.filter { !it.done && it.at.isNotBlank() && it.at <= nowIso }
            .sortedByDescending { it.at }
    }
    val upcoming = remember(reminders) {
        reminders.filter { !it.done && (it.at.isBlank() || it.at > nowIso) }
            .sortedBy { it.at }
    }
    val done = remember(reminders) {
        reminders.filter { it.done }.sortedByDescending { it.created }
    }

    fun buildDateTimeString(): String {
        val ms = pickedDateMillis ?: return ""
        val cal = Calendar.getInstance().apply {
            timeInMillis = ms
            set(Calendar.HOUR_OF_DAY, pickedHour)
            set(Calendar.MINUTE, pickedMinute)
        }
        return SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).format(cal.time)
    }

    fun addReminder() {
        if (reminderText.isBlank()) return
        viewModel.addReminder(
            Reminder(
                id = viewModel.generateId(),
                text = reminderText.trim(),
                at = selectedDateTime,
                done = false,
                created = System.currentTimeMillis()
            )
        )
        reminderText = ""
        selectedDateTime = ""
        pickedDateMillis = null
    }

    // Date picker dialog
    if (showDatePicker) {
        val datePickerState = rememberDatePickerState(
            initialSelectedDateMillis = pickedDateMillis ?: System.currentTimeMillis()
        )
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    pickedDateMillis = datePickerState.selectedDateMillis
                    showDatePicker = false
                    showTimePicker = true
                }) { Text("Next", color = Primary) }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) {
                    Text("Cancel", color = OnSurface2)
                }
            },
            colors = DatePickerDefaults.colors(containerColor = Surface2)
        ) {
            DatePicker(
                state = datePickerState,
                colors = DatePickerDefaults.colors(
                    containerColor = Surface2,
                    titleContentColor = OnSurface,
                    headlineContentColor = OnSurface,
                    selectedDayContainerColor = Primary
                )
            )
        }
    }

    // Time picker dialog
    if (showTimePicker) {
        val timePickerState = rememberTimePickerState(
            initialHour = pickedHour,
            initialMinute = pickedMinute
        )
        AlertDialog(
            onDismissRequest = { showTimePicker = false },
            containerColor = Surface2,
            title = { Text("Pick Time", color = OnSurface) },
            text = {
                TimePicker(
                    state = timePickerState,
                    colors = TimePickerDefaults.colors(
                        clockDialColor = Surface3,
                        selectorColor = Primary,
                        containerColor = Surface2,
                        timeSelectorSelectedContainerColor = Primary,
                        timeSelectorUnselectedContainerColor = Surface3
                    )
                )
            },
            confirmButton = {
                TextButton(onClick = {
                    pickedHour = timePickerState.hour
                    pickedMinute = timePickerState.minute
                    selectedDateTime = buildDateTimeString()
                    showTimePicker = false
                }) { Text("OK", color = Primary) }
            },
            dismissButton = {
                TextButton(onClick = { showTimePicker = false }) {
                    Text("Cancel", color = OnSurface2)
                }
            }
        )
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(10.dp),
        contentPadding = PaddingValues(vertical = 20.dp)
    ) {
        // Header
        item {
            Text(
                "Reminders",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
        }

        // Add reminder card
        item {
            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(
                    modifier = Modifier.padding(14.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    OutlinedTextField(
                        value = reminderText,
                        onValueChange = { reminderText = it },
                        modifier = Modifier.fillMaxWidth(),
                        placeholder = { Text("Reminder text...", color = OnSurface3) },
                        singleLine = true,
                        shape = RoundedCornerShape(10.dp),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedContainerColor = Surface3,
                            unfocusedContainerColor = Surface3,
                            focusedBorderColor = Primary,
                            unfocusedBorderColor = BorderColor,
                            focusedTextColor = OnSurface,
                            unfocusedTextColor = OnSurface
                        )
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        OutlinedButton(
                            onClick = { showDatePicker = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = androidx.compose.ui.graphics.SolidColor(
                                    if (selectedDateTime.isNotBlank()) Primary else BorderColor
                                )
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.Schedule,
                                null,
                                tint = if (selectedDateTime.isNotBlank()) Primary else OnSurface3,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                if (selectedDateTime.isNotBlank()) formatDateTime(selectedDateTime)
                                else "Set date & time",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    color = if (selectedDateTime.isNotBlank()) Primary else OnSurface3
                                ),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                        }

                        Button(
                            onClick = { addReminder() },
                            enabled = reminderText.isNotBlank(),
                            colors = ButtonDefaults.buttonColors(
                                containerColor = Primary,
                                disabledContainerColor = Surface3
                            ),
                            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 10.dp),
                            shape = RoundedCornerShape(10.dp)
                        ) {
                            Icon(Icons.Default.Add, null, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(4.dp))
                            Text("Add")
                        }
                    }
                }
            }
        }

        // Past due section
        if (pastDue.isNotEmpty()) {
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        "Past Due",
                        style = MaterialTheme.typography.titleSmall.copy(
                            fontWeight = FontWeight.Bold,
                            color = Danger
                        )
                    )
                    Badge(containerColor = Danger) {
                        Text(
                            pastDue.size.toString(),
                            style = MaterialTheme.typography.labelSmall.copy(color = Color.White)
                        )
                    }
                }
            }
            items(pastDue, key = { "past_${it.id}" }) { reminder ->
                ReminderCard(
                    reminder = reminder,
                    isPastDue = true,
                    onToggleDone = { viewModel.updateReminder(reminder.copy(done = !reminder.done)) },
                    onDelete = { viewModel.deleteReminder(reminder.id) }
                )
            }
        }

        // Upcoming section
        item {
            Text(
                "Upcoming",
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
        }

        if (upcoming.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 20.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.Notifications,
                            null,
                            tint = OnSurface3,
                            modifier = Modifier.size(40.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "No upcoming reminders",
                            style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface3)
                        )
                    }
                }
            }
        } else {
            items(upcoming, key = { "up_${it.id}" }) { reminder ->
                ReminderCard(
                    reminder = reminder,
                    isPastDue = false,
                    onToggleDone = { viewModel.updateReminder(reminder.copy(done = !reminder.done)) },
                    onDelete = { viewModel.deleteReminder(reminder.id) }
                )
            }
        }

        // Done section
        if (done.isNotEmpty()) {
            item {
                Text(
                    "Completed",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = OnSurface3
                    )
                )
            }
            items(done, key = { "done_${it.id}" }) { reminder ->
                ReminderCard(
                    reminder = reminder,
                    isPastDue = false,
                    isDone = true,
                    onToggleDone = { viewModel.updateReminder(reminder.copy(done = !reminder.done)) },
                    onDelete = { viewModel.deleteReminder(reminder.id) }
                )
            }
        }
    }
}

@Composable
private fun ReminderCard(
    reminder: Reminder,
    isPastDue: Boolean,
    isDone: Boolean = false,
    onToggleDone: () -> Unit,
    onDelete: () -> Unit
) {
    val containerColor = when {
        isDone -> Surface2.copy(alpha = 0.5f)
        isPastDue -> Danger.copy(alpha = 0.1f)
        else -> Surface2
    }

    ElevatedCard(
        colors = CardDefaults.elevatedCardColors(containerColor = containerColor),
        shape = RoundedCornerShape(12.dp),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = if (isDone) 1.dp else 3.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Bell icon
            Icon(
                if (isDone) Icons.Default.NotificationsOff else Icons.Default.Notifications,
                contentDescription = null,
                tint = when {
                    isDone -> OnSurface3
                    isPastDue -> Danger
                    else -> Info
                },
                modifier = Modifier.size(22.dp)
            )

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = reminder.text,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        color = if (isDone) OnSurface3 else OnSurface,
                        textDecoration = if (isDone) TextDecoration.LineThrough else null,
                        fontWeight = FontWeight.Medium
                    ),
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                if (reminder.at.isNotBlank()) {
                    Spacer(Modifier.height(4.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.Schedule,
                            null,
                            tint = if (isPastDue && !isDone) Danger else OnSurface3,
                            modifier = Modifier.size(12.dp)
                        )
                        Text(
                            text = formatDateTime(reminder.at),
                            style = MaterialTheme.typography.labelSmall.copy(
                                color = if (isPastDue && !isDone) Danger else OnSurface3
                            )
                        )
                    }
                }
            }

            // Done toggle
            IconButton(
                onClick = onToggleDone,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    if (isDone) Icons.Default.Replay else Icons.Default.CheckCircle,
                    contentDescription = if (isDone) "Mark undone" else "Mark done",
                    tint = if (isDone) OnSurface3 else Success,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Delete
            IconButton(
                onClick = onDelete,
                modifier = Modifier.size(36.dp)
            ) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = Danger,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

private fun formatDateTime(iso: String): String {
    return try {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault())
        val date = sdf.parse(iso) ?: return iso
        SimpleDateFormat("MMM d, h:mm a", Locale.getDefault()).format(date)
    } catch (e: Exception) {
        iso
    }
}
