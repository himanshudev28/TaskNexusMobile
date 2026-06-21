package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tasknexus.data.entity.BudgetTx
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.BudgetViewModel
import java.text.SimpleDateFormat
import java.util.*

// ─────────────────────────────────────────────────────────────────────────────
// BudgetScreen
// ─────────────────────────────────────────────────────────────────────────────

private val CATEGORIES = listOf(
    "Food", "Transport", "Shopping", "Health", "Housing",
    "Entertainment", "Education", "Utilities", "Salary", "Freelance", "Other"
)

private val CATEGORY_COLORS = mapOf(
    "Food" to Color(0xFFEF4444),
    "Transport" to Color(0xFF3B82F6),
    "Shopping" to Color(0xFFF59E0B),
    "Health" to Color(0xFF22C55E),
    "Housing" to Color(0xFF8B5CF6),
    "Entertainment" to Color(0xFFEC4899),
    "Education" to Color(0xFF06B6D4),
    "Utilities" to Color(0xFF64748B),
    "Salary" to Color(0xFF22C55E),
    "Freelance" to Color(0xFF4F46E5),
    "Other" to Color(0xFF94A3B8)
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun BudgetScreen(vm: BudgetViewModel = viewModel()) {
    val transactions by vm.uiState.collectAsState()

    // Add-transaction form state
    var desc by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var date by remember { mutableStateOf(todayDate()) }
    var category by remember { mutableStateOf(CATEGORIES.first()) }
    var txType by remember { mutableIntStateOf(0) } // 0 = income, 1 = expense
    var categoryExpanded by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }

    // Transaction filter
    var filterIndex by remember { mutableIntStateOf(0) } // 0=All,1=Income,2=Expense

    val income = transactions.filter { it.type == "income" }.sumOf { it.amount }
    val expense = transactions.filter { it.type == "expense" }.sumOf { it.amount }
    val balance = income - expense

    val filteredTx = when (filterIndex) {
        1 -> transactions.filter { it.type == "income" }
        2 -> transactions.filter { it.type == "expense" }
        else -> transactions
    }.sortedByDescending { it.created }

    // Category expense breakdown
    val expenseByCategory = transactions
        .filter { it.type == "expense" }
        .groupBy { it.category }
        .mapValues { (_, txs) -> txs.sumOf { it.amount } }
        .entries
        .sortedByDescending { it.value }

    // Date picker
    val datePickerState = rememberDatePickerState(
        initialSelectedDateMillis = System.currentTimeMillis()
    )
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            confirmButton = {
                TextButton(onClick = {
                    datePickerState.selectedDateMillis?.let { millis ->
                        date = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date(millis))
                    }
                    showDatePicker = false
                }) { Text("OK", color = Primary) }
            },
            dismissButton = {
                TextButton(onClick = { showDatePicker = false }) { Text("Cancel", color = OnSurface2) }
            },
            colors = DatePickerDefaults.colors(containerColor = Surface2)
        ) {
            DatePicker(
                state = datePickerState,
                colors = DatePickerDefaults.colors(
                    containerColor = Surface2,
                    titleContentColor = OnSurface,
                    headlineContentColor = Primary,
                    weekdayContentColor = OnSurface2,
                    subheadContentColor = OnSurface2,
                    navigationContentColor = OnSurface,
                    yearContentColor = OnSurface,
                    currentYearContentColor = Primary,
                    selectedYearContainerColor = Primary,
                    dayContentColor = OnSurface,
                    todayContentColor = Primary,
                    todayDateBorderColor = Primary,
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
        verticalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(vertical = 16.dp)
    ) {
        // ── Stat cards ──────────────────────────────────────────────────────
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard("Income", "₹${formatAmount(income)}", Success, Modifier.weight(1f))
                StatCard("Expenses", "₹${formatAmount(expense)}", Danger, Modifier.weight(1f))
                StatCard(
                    "Balance",
                    "₹${formatAmount(balance)}",
                    if (balance >= 0) Success else Danger,
                    Modifier.weight(1f)
                )
            }
        }

        // ── Add transaction card ─────────────────────────────────────────────
        item {
            ElevatedCard(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
                shape = RoundedCornerShape(16.dp)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Text(
                        "Add Transaction",
                        style = MaterialTheme.typography.titleMedium.copy(
                            fontWeight = FontWeight.Bold,
                            color = OnSurface
                        )
                    )

                    // Description
                    OutlinedTextField(
                        value = desc,
                        onValueChange = { desc = it },
                        label = { Text("Description") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = budgetTextFieldColors()
                    )

                    // Amount
                    OutlinedTextField(
                        value = amount,
                        onValueChange = { if (it.isEmpty() || it.matches(Regex("""^\d*\.?\d*$"""))) amount = it },
                        label = { Text("Amount (₹)") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        colors = budgetTextFieldColors()
                    )

                    // Date picker button
                    OutlinedButton(
                        onClick = { showDatePicker = true },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = OnSurface2)
                    ) {
                        Icon(
                            Icons.Default.CalendarMonth,
                            contentDescription = "Pick date",
                            modifier = Modifier.size(18.dp)
                        )
                        Spacer(Modifier.width(8.dp))
                        Text(date)
                    }

                    // Category dropdown
                    ExposedDropdownMenuBox(
                        expanded = categoryExpanded,
                        onExpandedChange = { categoryExpanded = !categoryExpanded }
                    ) {
                        OutlinedTextField(
                            value = category,
                            onValueChange = {},
                            readOnly = true,
                            label = { Text("Category") },
                            trailingIcon = {
                                ExposedDropdownMenuDefaults.TrailingIcon(expanded = categoryExpanded)
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .menuAnchor(MenuAnchorType.PrimaryEditable, true),
                            colors = budgetTextFieldColors()
                        )
                        ExposedDropdownMenu(
                            expanded = categoryExpanded,
                            onDismissRequest = { categoryExpanded = false },
                            modifier = Modifier.background(Surface3)
                        ) {
                            CATEGORIES.forEach { cat ->
                                DropdownMenuItem(
                                    text = { Text(cat, color = OnSurface) },
                                    onClick = {
                                        category = cat
                                        categoryExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    // Income / Expense toggle
                    SingleChoiceSegmentedButtonRow(modifier = Modifier.fillMaxWidth()) {
                        listOf("Income", "Expense").forEachIndexed { index, label ->
                            SegmentedButton(
                                selected = txType == index,
                                onClick = { txType = index },
                                shape = SegmentedButtonDefaults.itemShape(index = index, count = 2),
                                colors = SegmentedButtonDefaults.colors(
                                    activeContainerColor = if (index == 0) Success else Danger,
                                    activeContentColor = Color.White
                                )
                            ) {
                                Text(label, style = MaterialTheme.typography.labelMedium)
                            }
                        }
                    }

                    // Add button
                    Button(
                        onClick = {
                            val amountVal = amount.toDoubleOrNull() ?: 0.0
                            if (desc.isNotBlank() && amountVal > 0) {
                                vm.addTransaction(
                                    BudgetTx(
                                        id = vm.generateId(),
                                        desc = desc.trim(),
                                        amount = amountVal,
                                        type = if (txType == 0) "income" else "expense",
                                        category = category,
                                        date = date,
                                        created = System.currentTimeMillis()
                                    )
                                )
                                desc = ""
                                amount = ""
                                date = todayDate()
                                txType = 0
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Primary)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add", modifier = Modifier.size(18.dp))
                        Spacer(Modifier.width(6.dp))
                        Text("Add Transaction")
                    }
                }
            }
        }

        // ── Top expenses by category ─────────────────────────────────────────
        if (expenseByCategory.isNotEmpty()) {
            item {
                Text(
                    "Top Expenses",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                )
            }
            items(expenseByCategory.take(5)) { (cat, total) ->
                val catColor = CATEGORY_COLORS[cat] ?: OnSurface3
                val pct = if (expense > 0) (total / expense).toFloat() else 0f
                ElevatedCard(
                    colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Box(
                                    modifier = Modifier
                                        .size(10.dp)
                                        .clip(CircleShape)
                                        .background(catColor)
                                )
                                Spacer(Modifier.width(8.dp))
                                Text(cat, style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface))
                            }
                            Text(
                                "₹${formatAmount(total)} (${(pct * 100).toInt()}%)",
                                style = MaterialTheme.typography.bodySmall.copy(color = OnSurface2)
                            )
                        }
                        Spacer(Modifier.height(6.dp))
                        LinearProgressIndicator(
                            progress = { pct },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(6.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = catColor,
                            trackColor = Surface4
                        )
                    }
                }
            }
        }

        // ── Transaction history ──────────────────────────────────────────────
        item {
            Text(
                "Transactions",
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = OnSurface
                )
            )
            Spacer(Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                listOf("All", "Income", "Expense").forEachIndexed { idx, label ->
                    FilterChip(
                        selected = filterIndex == idx,
                        onClick = { filterIndex = idx },
                        label = { Text(label) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = Primary,
                            selectedLabelColor = Color.White
                        )
                    )
                }
            }
        }

        if (filteredTx.isEmpty()) {
            item {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Text("No transactions yet", color = OnSurface3)
                }
            }
        } else {
            items(filteredTx, key = { it.id }) { tx ->
                TransactionRow(tx = tx, onDelete = { vm.deleteTransaction(tx.id) })
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helper composables
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun StatCard(label: String, value: String, color: Color, modifier: Modifier = Modifier) {
    ElevatedCard(
        modifier = modifier,
        colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
            Text(
                text = value,
                style = MaterialTheme.typography.titleSmall.copy(
                    fontWeight = FontWeight.Bold,
                    color = color
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall.copy(color = OnSurface2)
            )
        }
    }
}

@Composable
private fun TransactionRow(tx: BudgetTx, onDelete: () -> Unit) {
    val isIncome = tx.type == "income"
    val color = if (isIncome) Success else Danger
    val catColor = CATEGORY_COLORS[tx.category] ?: OnSurface3

    ElevatedCard(
        colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            // Type icon
            Box(
                modifier = Modifier
                    .size(38.dp)
                    .clip(CircleShape)
                    .background(color.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    if (isIncome) Icons.Default.ArrowUpward else Icons.Default.ArrowDownward,
                    contentDescription = tx.type,
                    tint = color,
                    modifier = Modifier.size(20.dp)
                )
            }

            // Info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    tx.desc,
                    style = MaterialTheme.typography.bodyMedium.copy(
                        fontWeight = FontWeight.SemiBold,
                        color = OnSurface
                    ),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .clip(CircleShape)
                            .background(catColor)
                    )
                    Spacer(Modifier.width(4.dp))
                    Text(
                        "${tx.category} • ${tx.date}",
                        style = MaterialTheme.typography.labelSmall.copy(color = OnSurface3)
                    )
                }
            }

            // Amount
            Text(
                text = "${if (isIncome) "+" else "-"}₹${formatAmount(tx.amount)}",
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = color
                )
            )

            // Delete
            IconButton(onClick = onDelete, modifier = Modifier.size(32.dp)) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = OnSurface3,
                    modifier = Modifier.size(18.dp)
                )
            }
        }
    }
}

@Composable
private fun budgetTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = BorderColor,
    focusedLabelColor = Primary,
    cursorColor = Primary,
    focusedTextColor = OnSurface,
    unfocusedTextColor = OnSurface,
    unfocusedLabelColor = OnSurface2
)

private fun todayDate(): String =
    SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())

private fun formatAmount(amount: Double): String =
    if (amount == amount.toLong().toDouble()) amount.toLong().toString()
    else "%.2f".format(amount)
