package com.tasknexus.ui.screens

import androidx.compose.animation.animateColorAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
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
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavController
import com.tasknexus.data.entity.Todo
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.TodoViewModel
import kotlin.math.roundToInt

private val TODO_CATEGORIES = listOf("All", "Work", "Personal", "Shopping", "Health", "Finance", "Other")
private val TODO_PRIORITIES = listOf("high", "medium", "low")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TodoScreen(navController: NavController) {
    val viewModel: TodoViewModel = viewModel()
    val todos by viewModel.uiState.collectAsState()

    var taskTitle by remember { mutableStateOf("") }
    var selectedPriority by remember { mutableStateOf("medium") }
    var selectedCategory by remember { mutableStateOf("All") }
    var dueDate by remember { mutableStateOf("") }
    var filterStatus by remember { mutableStateOf("All") }
    var filterCategory by remember { mutableStateOf("All") }
    var categoryExpanded by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    var editingTodo by remember { mutableStateOf<Todo?>(null) }

    val nowIso = remember {
        java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm", java.util.Locale.getDefault())
            .format(java.util.Date())
    }

    val filteredTodos = remember(todos, filterStatus, filterCategory) {
        todos.filter { todo ->
            val statusMatch = when (filterStatus) {
                "Active" -> !todo.done
                "Completed" -> todo.done
                else -> true
            }
            val catMatch = filterCategory == "All" || todo.category == filterCategory
            statusMatch && catMatch
        }.sortedWith(
            compareBy<Todo> { it.done }
                .thenBy { TODO_PRIORITIES.indexOf(it.priority) }
                .thenBy { it.due }
        )
    }

    val completedCount = todos.count { it.done }
    val totalCount = todos.size
    val progress = if (totalCount > 0) completedCount.toFloat() / totalCount else 0f

    fun addOrUpdateTask() {
        if (taskTitle.isBlank()) return
        val now = System.currentTimeMillis()
        val editing = editingTodo
        if (editing != null) {
            viewModel.updateTodo(
                editing.copy(
                    title = taskTitle.trim(),
                    priority = selectedPriority,
                    category = if (selectedCategory == "All") "Other" else selectedCategory,
                    due = dueDate
                )
            )
            editingTodo = null
        } else {
            viewModel.addTodo(
                Todo(
                    id = viewModel.generateId(),
                    title = taskTitle.trim(),
                    priority = selectedPriority,
                    category = if (selectedCategory == "All") "Other" else selectedCategory,
                    due = dueDate,
                    note = "",
                    done = false,
                    created = now
                )
            )
        }
        taskTitle = ""
        dueDate = ""
        selectedPriority = "medium"
        selectedCategory = "All"
    }

    if (showDatePicker) {
        val datePickerState = rememberDatePickerState()
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    val ms = datePickerState.selectedDateMillis
                    if (ms != null) {
                        dueDate = java.text.SimpleDateFormat(
                            "yyyy-MM-dd'T'HH:mm",
                            java.util.Locale.getDefault()
                        ).format(java.util.Date(ms))
                    }
                    showDatePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel") }
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

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(horizontal = 16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(vertical = 20.dp)
    ) {
        // Header
        item {
            Text(
                "To-Do",
                style = MaterialTheme.typography.headlineMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
        }

        // Add task input
        item {
            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    // Title input
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        OutlinedTextField(
                            value = taskTitle,
                            onValueChange = { taskTitle = it },
                            modifier = Modifier.weight(1f),
                            placeholder = { Text(if (editingTodo != null) "Edit task..." else "Add new task...", color = OnSurface3) },
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
                        IconButton(
                            onClick = { addOrUpdateTask() },
                            modifier = Modifier
                                .size(48.dp)
                                .clip(RoundedCornerShape(10.dp))
                                .background(Primary)
                        ) {
                            Icon(
                                if (editingTodo != null) Icons.Default.Check else Icons.Default.Add,
                                contentDescription = "Add Task",
                                tint = Color.White
                            )
                        }
                    }

                    // Priority chips
                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        TODO_PRIORITIES.forEach { priority ->
                            val isSelected = selectedPriority == priority
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedPriority = priority },
                                label = {
                                    Text(
                                        priority.replaceFirstChar { it.uppercase() },
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = priorityColor(priority).copy(alpha = 0.3f),
                                    selectedLabelColor = priorityColor(priority),
                                    containerColor = Surface3,
                                    labelColor = OnSurface2
                                )
                            )
                        }
                    }

                    // Category + Due Date row
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Category dropdown
                        Box(modifier = Modifier.weight(1f)) {
                            OutlinedButton(
                                onClick = { categoryExpanded = true },
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(10.dp),
                                border = ButtonDefaults.outlinedButtonBorder.copy(
                                    brush = androidx.compose.ui.graphics.SolidColor(BorderColor)
                                ),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        selectedCategory,
                                        style = MaterialTheme.typography.labelMedium.copy(color = OnSurface)
                                    )
                                    Icon(Icons.Default.ArrowDropDown, null, tint = OnSurface2, modifier = Modifier.size(18.dp))
                                }
                            }
                            DropdownMenu(
                                expanded = categoryExpanded,
                                onDismissRequest = { categoryExpanded = false },
                                modifier = Modifier.background(Surface2)
                            ) {
                                TODO_CATEGORIES.forEach { cat ->
                                    DropdownMenuItem(
                                        text = { Text(cat, color = OnSurface) },
                                        onClick = {
                                            selectedCategory = cat
                                            categoryExpanded = false
                                        }
                                    )
                                }
                            }
                        }

                        // Due date button
                        OutlinedButton(
                            onClick = { showDatePicker = true },
                            modifier = Modifier.weight(1f),
                            shape = RoundedCornerShape(10.dp),
                            border = ButtonDefaults.outlinedButtonBorder.copy(
                                brush = androidx.compose.ui.graphics.SolidColor(
                                    if (dueDate.isNotBlank()) Primary else BorderColor
                                )
                            ),
                            contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                        ) {
                            Icon(
                                Icons.Default.CalendarToday,
                                null,
                                tint = if (dueDate.isNotBlank()) Primary else OnSurface2,
                                modifier = Modifier.size(16.dp)
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                if (dueDate.isNotBlank()) dueDate.take(10) else "Due date",
                                style = MaterialTheme.typography.labelMedium.copy(
                                    color = if (dueDate.isNotBlank()) Primary else OnSurface2
                                )
                            )
                        }
                    }

                    if (editingTodo != null) {
                        TextButton(onClick = { editingTodo = null; taskTitle = ""; dueDate = "" }) {
                            Text("Cancel Edit", color = OnSurface3)
                        }
                    }
                }
            }
        }

        // Progress bar
        item {
            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            "Progress",
                            style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2)
                        )
                        Text(
                            "$completedCount / $totalCount completed",
                            style = MaterialTheme.typography.labelMedium.copy(color = OnSurface3)
                        )
                    }
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(6.dp)
                            .clip(RoundedCornerShape(3.dp)),
                        color = Success,
                        trackColor = Surface3
                    )
                }
            }
        }

        // Filter chips
        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                item {
                    listOf("All", "Active", "Completed").forEach { status ->
                        FilterChip(
                            selected = filterStatus == status,
                            onClick = { filterStatus = status },
                            label = { Text(status, style = MaterialTheme.typography.labelSmall) },
                            modifier = Modifier.padding(end = 8.dp),
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = Primary.copy(alpha = 0.25f),
                                selectedLabelColor = Primary,
                                containerColor = Surface2,
                                labelColor = OnSurface2
                            )
                        )
                    }
                }
                items(TODO_CATEGORIES.drop(1)) { cat ->
                    FilterChip(
                        selected = filterCategory == cat,
                        onClick = { filterCategory = if (filterCategory == cat) "All" else cat },
                        label = { Text(cat, style = MaterialTheme.typography.labelSmall) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Accent.copy(alpha = 0.25f),
                            selectedLabelColor = Accent,
                            containerColor = Surface2,
                            labelColor = OnSurface2
                        )
                    )
                }
            }
        }

        // Empty state
        if (filteredTodos.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 40.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            Icons.Default.CheckBox,
                            contentDescription = null,
                            tint = OnSurface3,
                            modifier = Modifier.size(48.dp)
                        )
                        Spacer(Modifier.height(8.dp))
                        Text(
                            "No tasks found",
                            style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface3)
                        )
                    }
                }
            }
        }

        // Task items
        items(filteredTodos, key = { it.id }) { todo ->
            val isOverdue = !todo.done && todo.due.isNotBlank() && todo.due < nowIso
            SwipeableTodoCard(
                todo = todo,
                isOverdue = isOverdue,
                onToggle = { viewModel.updateTodo(todo.copy(done = !todo.done)) },
                onEdit = {
                    editingTodo = todo
                    taskTitle = todo.title
                    selectedPriority = todo.priority
                    selectedCategory = todo.category.ifBlank { "All" }
                    dueDate = todo.due
                },
                onDelete = { viewModel.deleteTodo(todo.id) },
                onComplete = { viewModel.updateTodo(todo.copy(done = true)) }
            )
        }
    }
}

@Composable
private fun SwipeableTodoCard(
    todo: Todo,
    isOverdue: Boolean,
    onToggle: () -> Unit,
    onEdit: () -> Unit,
    onDelete: () -> Unit,
    onComplete: () -> Unit
) {
    var offsetX by remember { mutableStateOf(0f) }
    val swipeThreshold = 200f

    val backgroundColor by animateColorAsState(
        when {
            offsetX > swipeThreshold / 2 -> Success.copy(alpha = 0.3f)
            offsetX < -swipeThreshold / 2 -> Danger.copy(alpha = 0.3f)
            else -> if (isOverdue) Danger.copy(alpha = 0.08f) else Surface2
        },
        label = "swipeBg"
    )

    Box(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .background(backgroundColor)
    ) {
        // Swipe indicators
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp)
                .align(Alignment.Center),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(Icons.Default.Check, null, tint = Success.copy(alpha = 0.6f))
            Icon(Icons.Default.Delete, null, tint = Danger.copy(alpha = 0.6f))
        }

        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .offset { IntOffset(offsetX.roundToInt(), 0) }
                .pointerInput(Unit) {
                    detectHorizontalDragGestures(
                        onDragEnd = {
                            when {
                                offsetX > swipeThreshold -> {
                                    onComplete()
                                    offsetX = 0f
                                }
                                offsetX < -swipeThreshold -> {
                                    onDelete()
                                    offsetX = 0f
                                }
                                else -> offsetX = 0f
                            }
                        },
                        onDragCancel = { offsetX = 0f },
                        onHorizontalDrag = { _, dragAmount ->
                            offsetX = (offsetX + dragAmount).coerceIn(-swipeThreshold * 1.5f, swipeThreshold * 1.5f)
                        }
                    )
                },
            colors = CardDefaults.elevatedCardColors(
                containerColor = if (isOverdue) Danger.copy(alpha = 0.12f) else Surface2
            ),
            shape = RoundedCornerShape(12.dp),
            elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(12.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Checkbox(
                    checked = todo.done,
                    onCheckedChange = { onToggle() },
                    colors = CheckboxDefaults.colors(
                        checkedColor = Success,
                        uncheckedColor = OnSurface3
                    )
                )

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = todo.title,
                        style = MaterialTheme.typography.bodyMedium.copy(
                            color = if (todo.done) OnSurface3 else if (isOverdue) Danger else OnSurface,
                            textDecoration = if (todo.done) TextDecoration.LineThrough else null,
                            fontWeight = FontWeight.Medium
                        ),
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    Spacer(Modifier.height(4.dp))
                    Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                        // Priority chip
                        Surface(
                            color = priorityColor(todo.priority).copy(alpha = 0.2f),
                            shape = RoundedCornerShape(4.dp)
                        ) {
                            Text(
                                text = todo.priority.replaceFirstChar { it.uppercase() },
                                style = MaterialTheme.typography.labelSmall.copy(color = priorityColor(todo.priority)),
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                        // Category chip
                        if (todo.category.isNotBlank()) {
                            Surface(
                                color = Accent.copy(alpha = 0.15f),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = todo.category,
                                    style = MaterialTheme.typography.labelSmall.copy(color = Accent),
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }
                        // Due date
                        if (todo.due.isNotBlank()) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(
                                    Icons.Default.Schedule,
                                    null,
                                    tint = if (isOverdue) Danger else OnSurface3,
                                    modifier = Modifier.size(12.dp)
                                )
                                Spacer(Modifier.width(3.dp))
                                Text(
                                    text = todo.due.take(10),
                                    style = MaterialTheme.typography.labelSmall.copy(
                                        color = if (isOverdue) Danger else OnSurface3
                                    )
                                )
                            }
                        }
                    }
                }

                // Edit / Delete
                Row {
                    IconButton(onClick = onEdit, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Default.Edit, null, tint = OnSurface3, modifier = Modifier.size(18.dp))
                    }
                    IconButton(onClick = onDelete, modifier = Modifier.size(36.dp)) {
                        Icon(Icons.Default.Delete, null, tint = Danger, modifier = Modifier.size(18.dp))
                    }
                }
            }
        }
    }
}

private fun priorityColor(priority: String): Color = when (priority) {
    "high" -> Danger
    "medium" -> Warning
    else -> Success
}
