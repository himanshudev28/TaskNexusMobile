package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.tasknexus.data.entity.BudgetTx
import com.tasknexus.data.entity.Note
import com.tasknexus.data.entity.Reminder
import com.tasknexus.data.entity.Todo
import com.tasknexus.navigation.Screen
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.BudgetViewModel
import com.tasknexus.viewmodel.NoteViewModel
import com.tasknexus.viewmodel.ReminderViewModel
import com.tasknexus.viewmodel.TodoViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DashboardScreen(navController: NavController) {
    val noteVm: NoteViewModel = viewModel()
    val todoVm: TodoViewModel = viewModel()
    val reminderVm: ReminderViewModel = viewModel()
    val budgetVm: BudgetViewModel = viewModel()

    val notes by noteVm.uiState.collectAsState()
    val todos by todoVm.uiState.collectAsState()
    val reminders by reminderVm.uiState.collectAsState()
    val transactions by budgetVm.uiState.collectAsState()

    val now = System.currentTimeMillis()
    val nowIso = SimpleDateFormat("yyyy-MM-dd'T'HH:mm", Locale.getDefault()).format(Date(now))

    val pendingTasks = todos.count { !it.done }
    val urgentTasks = todos.filter { !it.done && it.priority == "high" }
    val dueTasks = todos.filter { !it.done && it.due.isNotBlank() && it.due <= nowIso }
    val upcomingReminders = reminders.filter { !it.done && it.at > nowIso }
        .sortedBy { it.at }
    val income = transactions.filter { it.type == "income" }.sumOf { it.amount }
    val expense = transactions.filter { it.type == "expense" }.sumOf { it.amount }
    val balance = income - expense

    val hour = Calendar.getInstance().get(Calendar.HOUR_OF_DAY)
    val greeting = when {
        hour < 12 -> "Good morning"
        hour < 17 -> "Good afternoon"
        else -> "Good evening"
    }

    val statCards = listOf(
        Triple("Notes", notes.size.toString(), Screen.Notes.route),
        Triple("Pending Tasks", pendingTasks.toString(), Screen.Todo.route),
        Triple("Urgent", urgentTasks.size.toString(), Screen.Todo.route),
        Triple("Due Now", dueTasks.size.toString(), Screen.Todo.route),
        Triple("Upcoming", upcomingReminders.size.toString(), Screen.Reminders.route),
        Triple("Balance", "₹${String.format("%.0f", balance)}", Screen.Budget.route)
    )

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 20.dp)
    ) {
        // Greeting
        item {
            Text(
                text = greeting,
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
            Text(
                text = "Here's what's happening today",
                style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface2),
                modifier = Modifier.padding(top = 2.dp)
            )
        }

        // Stat cards grid (2 columns, 3 rows using chunked LazyColumn rows)
        item {
            statCards.chunked(2).forEach { row ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    row.forEach { (label, value, route) ->
                        ElevatedCard(
                            modifier = Modifier
                                .weight(1f)
                                .clickable { navController.navigate(route) },
                            colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 4.dp),
                            shape = RoundedCornerShape(14.dp)
                        ) {
                            Column(
                                modifier = Modifier.padding(16.dp),
                                verticalArrangement = Arrangement.spacedBy(4.dp)
                            ) {
                                Text(
                                    text = value,
                                    style = MaterialTheme.typography.headlineSmall.copy(
                                        fontWeight = FontWeight.Bold,
                                        color = Primary
                                    )
                                )
                                Text(
                                    text = label,
                                    style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2)
                                )
                            }
                        }
                    }
                    // Fill empty slot if odd number
                    if (row.size == 1) Spacer(Modifier.weight(1f))
                }
            }
        }

        // Urgent tasks + Upcoming reminders side by side
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                // Urgent tasks
                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Warning,
                                contentDescription = null,
                                tint = Danger,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "Urgent",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Danger
                                )
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        if (urgentTasks.isEmpty()) {
                            Text(
                                "No urgent tasks",
                                style = MaterialTheme.typography.bodySmall.copy(color = OnSurface3)
                            )
                        } else {
                            urgentTasks.take(3).forEach { task ->
                                Text(
                                    text = "- ${task.title}",
                                    style = MaterialTheme.typography.bodySmall.copy(color = OnSurface),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                )
                            }
                        }
                    }
                }

                // Upcoming reminders
                ElevatedCard(
                    modifier = Modifier.weight(1f),
                    colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
                    shape = RoundedCornerShape(14.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                Icons.Default.Notifications,
                                contentDescription = null,
                                tint = Info,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                "Reminders",
                                style = MaterialTheme.typography.labelLarge.copy(
                                    fontWeight = FontWeight.Bold,
                                    color = Info
                                )
                            )
                        }
                        Spacer(Modifier.height(8.dp))
                        if (upcomingReminders.isEmpty()) {
                            Text(
                                "No upcoming reminders",
                                style = MaterialTheme.typography.bodySmall.copy(color = OnSurface3)
                            )
                        } else {
                            upcomingReminders.take(3).forEach { reminder ->
                                Text(
                                    text = "- ${reminder.text}",
                                    style = MaterialTheme.typography.bodySmall.copy(color = OnSurface),
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.padding(vertical = 2.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Recent notes
        item {
            Text(
                "Recent Notes",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
            Spacer(Modifier.height(8.dp))
            val recentNotes = notes.sortedByDescending { it.updated }.take(3)
            if (recentNotes.isEmpty()) {
                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(20.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            "No notes yet",
                            style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface3)
                        )
                    }
                }
            } else {
                recentNotes.forEach { note ->
                    val noteColor = parseNoteColor(note.color)
                    ElevatedCard(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(bottom = 8.dp)
                            .clickable { navController.navigate("note_editor/${note.id}") },
                        colors = CardDefaults.elevatedCardColors(containerColor = noteColor ?: Surface2),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Column(modifier = Modifier.padding(14.dp)) {
                            Text(
                                text = note.title.ifBlank { "Untitled" },
                                style = MaterialTheme.typography.titleSmall.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = OnSurface
                                ),
                                maxLines = 1,
                                overflow = TextOverflow.Ellipsis
                            )
                            if (note.body.isNotBlank()) {
                                Text(
                                    text = note.body,
                                    style = MaterialTheme.typography.bodySmall.copy(color = OnSurface2),
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis,
                                    modifier = Modifier.padding(top = 4.dp)
                                )
                            }
                        }
                    }
                }
            }
        }

        // Budget snapshot
        item {
            Text(
                "Budget Snapshot",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
            Spacer(Modifier.height(8.dp))
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                shape = RoundedCornerShape(14.dp)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    BudgetItem(label = "Income", amount = income, color = Success)
                    Divider(
                        modifier = Modifier
                            .height(48.dp)
                            .width(1.dp),
                        color = BorderColor
                    )
                    BudgetItem(label = "Expense", amount = expense, color = Danger)
                    Divider(
                        modifier = Modifier
                            .height(48.dp)
                            .width(1.dp),
                        color = BorderColor
                    )
                    BudgetItem(
                        label = "Balance",
                        amount = balance,
                        color = if (balance >= 0) Success else Danger
                    )
                }
            }
        }

        // Quick action buttons
        item {
            Text(
                "Quick Actions",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
            Spacer(Modifier.height(8.dp))
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                val actions = listOf(
                    Triple("New Note", Icons.Default.Note, "note_editor/new"),
                    Triple("Add Task", Icons.Default.AddTask, Screen.Todo.route),
                    Triple("Reminder", Icons.Default.NotificationAdd, Screen.Reminders.route),
                    Triple("Budget", Icons.Default.AttachMoney, Screen.Budget.route)
                )
                items(actions) { (label, icon, route) ->
                    QuickActionButton(
                        label = label,
                        icon = icon,
                        onClick = { navController.navigate(route) }
                    )
                }
            }
        }
    }
}

@Composable
private fun BudgetItem(label: String, amount: Double, color: Color) {
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
        Text(
            text = "₹${String.format("%.0f", amount)}",
            style = MaterialTheme.typography.titleSmall.copy(
                fontWeight = FontWeight.Bold,
                color = color
            )
        )
        Text(
            text = label,
            style = MaterialTheme.typography.labelSmall.copy(color = OnSurface2),
            modifier = Modifier.padding(top = 2.dp)
        )
    }
}

@Composable
private fun QuickActionButton(label: String, icon: ImageVector, onClick: () -> Unit) {
    ElevatedCard(
        modifier = Modifier
            .clip(RoundedCornerShape(12.dp))
            .clickable { onClick() },
        colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            Icon(icon, contentDescription = label, tint = Primary, modifier = Modifier.size(24.dp))
            Text(
                label,
                style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2)
            )
        }
    }
}

private fun parseNoteColor(color: String): Color? {
    return try {
        if (color.startsWith("#")) {
            val hex = color.removePrefix("#")
            when (hex.length) {
                6 -> Color(android.graphics.Color.parseColor("#$hex"))
                8 -> Color(android.graphics.Color.parseColor("#$hex"))
                else -> null
            }
        } else null
    } catch (e: Exception) {
        null
    }
}
