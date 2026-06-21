package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Backspace
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlin.math.pow

// ─────────────────────────────────────────────────────────────────────────────
// CalculatorScreen
// ─────────────────────────────────────────────────────────────────────────────

@Composable
fun CalculatorScreen() {
    var selectedTab by remember { mutableIntStateOf(0) }
    val tabs = listOf("Basic", "EMI", "Interest", "ROI")

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
                            title,
                            style = MaterialTheme.typography.labelLarge.copy(
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal
                            )
                        )
                    }
                )
            }
        }

        when (selectedTab) {
            0 -> BasicCalculatorTab()
            1 -> EmiCalculatorTab()
            2 -> SimpleInterestTab()
            3 -> RoiCalculatorTab()
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Basic Calculator
// ─────────────────────────────────────────────────────────────────────────────

private data class CalcButton(
    val label: String,
    val type: ButtonType
)

private enum class ButtonType { NUMBER, OPERATOR, EQUALS, CLEAR, BACKSPACE, DECIMAL }

@Composable
private fun BasicCalculatorTab() {
    var expression by remember { mutableStateOf("") }
    var result by remember { mutableStateOf("") }
    var justEvaluated by remember { mutableStateOf(false) }

    val buttons = listOf(
        listOf(
            CalcButton("C", ButtonType.CLEAR),
            CalcButton("⌫", ButtonType.BACKSPACE),
            CalcButton("%", ButtonType.OPERATOR),
            CalcButton("÷", ButtonType.OPERATOR)
        ),
        listOf(
            CalcButton("7", ButtonType.NUMBER),
            CalcButton("8", ButtonType.NUMBER),
            CalcButton("9", ButtonType.NUMBER),
            CalcButton("×", ButtonType.OPERATOR)
        ),
        listOf(
            CalcButton("4", ButtonType.NUMBER),
            CalcButton("5", ButtonType.NUMBER),
            CalcButton("6", ButtonType.NUMBER),
            CalcButton("-", ButtonType.OPERATOR)
        ),
        listOf(
            CalcButton("1", ButtonType.NUMBER),
            CalcButton("2", ButtonType.NUMBER),
            CalcButton("3", ButtonType.NUMBER),
            CalcButton("+", ButtonType.OPERATOR)
        ),
        listOf(
            CalcButton(".", ButtonType.DECIMAL),
            CalcButton("0", ButtonType.NUMBER),
            CalcButton("=", ButtonType.EQUALS),
            CalcButton("+/-", ButtonType.OPERATOR)
        )
    )

    fun onButton(btn: CalcButton) {
        when (btn.type) {
            ButtonType.CLEAR -> {
                expression = ""
                result = ""
                justEvaluated = false
            }
            ButtonType.BACKSPACE -> {
                if (justEvaluated) {
                    expression = ""
                    result = ""
                    justEvaluated = false
                } else if (expression.isNotEmpty()) {
                    expression = expression.dropLast(1)
                    result = safeEval(expression)
                }
            }
            ButtonType.NUMBER -> {
                if (justEvaluated) {
                    expression = btn.label
                    justEvaluated = false
                } else {
                    expression += btn.label
                }
                result = safeEval(expression)
            }
            ButtonType.DECIMAL -> {
                if (justEvaluated) {
                    expression = "0."
                    justEvaluated = false
                } else {
                    // Only add dot if last number segment doesn't have one
                    val segments = expression.split(Regex("[+\\-×÷%]"))
                    if (!segments.last().contains('.')) {
                        if (expression.isEmpty() || expression.last().isOperatorChar()) {
                            expression += "0."
                        } else {
                            expression += "."
                        }
                    }
                }
                result = safeEval(expression)
            }
            ButtonType.OPERATOR -> {
                if (btn.label == "+/-") {
                    // Toggle sign of last number
                    val match = Regex("""(-?\d+\.?\d*)$""").find(expression)
                    if (match != null) {
                        val num = match.value
                        val toggled = if (num.startsWith("-")) num.drop(1) else "-$num"
                        expression = expression.dropLast(num.length) + toggled
                    }
                } else if (btn.label == "%") {
                    // Convert last number to percentage
                    val match = Regex("""(\d+\.?\d*)$""").find(expression)
                    if (match != null) {
                        val num = match.value.toDoubleOrNull()
                        if (num != null) {
                            val pct = num / 100
                            expression = expression.dropLast(match.value.length) + pct
                        }
                    }
                } else {
                    if (justEvaluated) {
                        expression = result + btn.label
                        justEvaluated = false
                    } else if (expression.isNotEmpty() && !expression.last().isOperatorChar()) {
                        expression += btn.label
                    } else if (expression.isNotEmpty()) {
                        expression = expression.dropLast(1) + btn.label
                    }
                }
                result = safeEval(expression)
            }
            ButtonType.EQUALS -> {
                val evaluated = safeEval(expression)
                if (evaluated.isNotEmpty() && evaluated != "Error") {
                    expression = evaluated
                    result = ""
                    justEvaluated = true
                }
            }
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(12.dp)
    ) {
        // Display
        ElevatedCard(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 20.dp, vertical = 12.dp),
                verticalArrangement = Arrangement.Bottom,
                horizontalAlignment = Alignment.End
            ) {
                Text(
                    text = expression.ifEmpty { "0" },
                    fontFamily = FontFamily.Monospace,
                    fontSize = 28.sp,
                    color = OnSurface2,
                    textAlign = TextAlign.End,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.fillMaxWidth()
                )
                if (result.isNotEmpty()) {
                    Spacer(Modifier.height(4.dp))
                    Text(
                        text = "= $result",
                        fontFamily = FontFamily.Monospace,
                        fontSize = 40.sp,
                        fontWeight = FontWeight.Light,
                        color = OnSurface,
                        textAlign = TextAlign.End,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        }

        Spacer(Modifier.height(12.dp))

        // Button grid
        buttons.forEach { row ->
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                row.forEach { btn ->
                    CalcButtonView(
                        btn = btn,
                        modifier = Modifier.weight(1f),
                        onClick = { onButton(btn) }
                    )
                }
            }
        }
    }
}

@Composable
private fun CalcButtonView(btn: CalcButton, modifier: Modifier = Modifier, onClick: () -> Unit) {
    val (containerColor, contentColor) = when (btn.type) {
        ButtonType.EQUALS -> Pair(Primary, Color.White)
        ButtonType.OPERATOR -> Pair(Surface4, Info)
        ButtonType.CLEAR -> Pair(Danger.copy(alpha = 0.15f), Danger)
        ButtonType.BACKSPACE -> Pair(Warning.copy(alpha = 0.15f), Warning)
        else -> Pair(Surface3, OnSurface)
    }

    Box(
        modifier = modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(14.dp))
            .background(containerColor)
            .clickable { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (btn.label == "⌫") {
            Icon(
                Icons.AutoMirrored.Filled.Backspace,
                contentDescription = "Backspace",
                tint = contentColor,
                modifier = Modifier.size(22.dp)
            )
        } else {
            Text(
                text = btn.label,
                fontSize = 22.sp,
                fontWeight = FontWeight.SemiBold,
                color = contentColor,
                textAlign = TextAlign.Center
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// EMI Calculator
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun EmiCalculatorTab() {
    var principal by remember { mutableStateOf("") }
    var rate by remember { mutableStateOf("") }
    var months by remember { mutableStateOf("") }
    var emi by remember { mutableStateOf<Double?>(null) }
    var totalAmount by remember { mutableStateOf<Double?>(null) }
    var totalInterest by remember { mutableStateOf<Double?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "EMI Calculator",
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                color = OnSurface
            )
        )

        OutlinedTextField(
            value = principal,
            onValueChange = { if (it.isNumeric()) principal = it },
            label = { Text("Principal Amount (₹)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        OutlinedTextField(
            value = rate,
            onValueChange = { if (it.isNumeric()) rate = it },
            label = { Text("Annual Interest Rate (%)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        OutlinedTextField(
            value = months,
            onValueChange = { if (it.isNumericInt()) months = it },
            label = { Text("Loan Duration (Months)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        Button(
            onClick = {
                val p = principal.toDoubleOrNull() ?: 0.0
                val r = (rate.toDoubleOrNull() ?: 0.0) / 12 / 100
                val n = months.toIntOrNull() ?: 0
                if (p > 0 && n > 0) {
                    val emiVal = if (r == 0.0) p / n
                    else p * r * (1 + r).pow(n) / ((1 + r).pow(n) - 1)
                    emi = emiVal
                    totalAmount = emiVal * n
                    totalInterest = emiVal * n - p
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Calculate EMI")
        }

        if (emi != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ResultCard(
                    label = "Monthly EMI",
                    value = "₹${formatCalcAmount(emi!!)}",
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
                ResultCard(
                    label = "Total Amount",
                    value = "₹${formatCalcAmount(totalAmount!!)}",
                    color = Info,
                    modifier = Modifier.weight(1f)
                )
            }
            ResultCard(
                label = "Total Interest",
                value = "₹${formatCalcAmount(totalInterest!!)}",
                color = Danger,
                modifier = Modifier.fillMaxWidth()
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple Interest Calculator
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun SimpleInterestTab() {
    var principal by remember { mutableStateOf("") }
    var rate by remember { mutableStateOf("") }
    var time by remember { mutableStateOf("") }
    var si by remember { mutableStateOf<Double?>(null) }
    var total by remember { mutableStateOf<Double?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "Simple Interest",
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                color = OnSurface
            )
        )

        OutlinedTextField(
            value = principal,
            onValueChange = { if (it.isNumeric()) principal = it },
            label = { Text("Principal (P) ₹") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        OutlinedTextField(
            value = rate,
            onValueChange = { if (it.isNumeric()) rate = it },
            label = { Text("Rate of Interest (R) % per year") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        OutlinedTextField(
            value = time,
            onValueChange = { if (it.isNumeric()) time = it },
            label = { Text("Time (T) in years") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        Button(
            onClick = {
                val p = principal.toDoubleOrNull() ?: 0.0
                val r = rate.toDoubleOrNull() ?: 0.0
                val t = time.toDoubleOrNull() ?: 0.0
                if (p > 0 && r > 0 && t > 0) {
                    si = (p * r * t) / 100.0
                    total = p + si!!
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Calculate")
        }

        if (si != null) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ResultCard(
                    label = "Simple Interest",
                    value = "₹${formatCalcAmount(si!!)}",
                    color = Success,
                    modifier = Modifier.weight(1f)
                )
                ResultCard(
                    label = "Total Amount",
                    value = "₹${formatCalcAmount(total!!)}",
                    color = Primary,
                    modifier = Modifier.weight(1f)
                )
            }
            Text(
                text = "SI = (P × R × T) / 100 = (${principal} × ${rate} × ${time}) / 100",
                style = MaterialTheme.typography.labelSmall.copy(color = OnSurface3)
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROI Calculator
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun RoiCalculatorTab() {
    var cost by remember { mutableStateOf("") }
    var revenue by remember { mutableStateOf("") }
    var profit by remember { mutableStateOf<Double?>(null) }
    var roi by remember { mutableStateOf<Double?>(null) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(14.dp)
    ) {
        Text(
            "Return on Investment",
            style = MaterialTheme.typography.titleMedium.copy(
                fontWeight = FontWeight.Bold,
                color = OnSurface
            )
        )

        OutlinedTextField(
            value = cost,
            onValueChange = { if (it.isNumeric()) cost = it },
            label = { Text("Cost of Investment (₹)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        OutlinedTextField(
            value = revenue,
            onValueChange = { if (it.isNumeric()) revenue = it },
            label = { Text("Revenue / Return (₹)") },
            singleLine = true,
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
            modifier = Modifier.fillMaxWidth(),
            colors = calcTextFieldColors()
        )

        Button(
            onClick = {
                val c = cost.toDoubleOrNull() ?: 0.0
                val r = revenue.toDoubleOrNull() ?: 0.0
                if (c > 0) {
                    profit = r - c
                    roi = ((r - c) / c) * 100.0
                }
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Primary)
        ) {
            Text("Calculate ROI")
        }

        if (profit != null && roi != null) {
            val profitVal = profit!!
            val roiVal = roi!!
            val isPositive = profitVal >= 0

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                ResultCard(
                    label = "Net Profit",
                    value = "${if (isPositive) "+" else ""}₹${formatCalcAmount(profitVal)}",
                    color = if (isPositive) Success else Danger,
                    modifier = Modifier.weight(1f)
                )
                ResultCard(
                    label = "ROI",
                    value = "${"%.2f".format(roiVal)}%",
                    color = if (isPositive) Primary else Danger,
                    modifier = Modifier.weight(1f)
                )
            }

            ElevatedCard(
                colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
                shape = RoundedCornerShape(12.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(
                        "Formula: ROI = (Revenue - Cost) / Cost × 100",
                        style = MaterialTheme.typography.labelSmall.copy(color = OnSurface3)
                    )
                    Spacer(Modifier.height(4.dp))
                    Text(
                        "= (${revenue} - ${cost}) / ${cost} × 100",
                        style = MaterialTheme.typography.labelSmall.copy(color = OnSurface2)
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared result card
// ─────────────────────────────────────────────────────────────────────────────

@Composable
private fun ResultCard(
    label: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier
) {
    ElevatedCard(
        colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
        shape = RoundedCornerShape(14.dp),
        modifier = modifier
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            verticalArrangement = Arrangement.spacedBy(4.dp)
        ) {
            Text(
                value,
                style = MaterialTheme.typography.titleMedium.copy(
                    fontWeight = FontWeight.Bold,
                    color = color
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                label,
                style = MaterialTheme.typography.labelSmall.copy(color = OnSurface2)
            )
        }
    }
}

@Composable
private fun calcTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = BorderColor,
    focusedLabelColor = Primary,
    cursorColor = Primary,
    focusedTextColor = OnSurface,
    unfocusedTextColor = OnSurface,
    unfocusedLabelColor = OnSurface2
)

// ─────────────────────────────────────────────────────────────────────────────
// Expression evaluator
// ─────────────────────────────────────────────────────────────────────────────

private fun safeEval(expr: String): String {
    return try {
        val result = evalExpression(expr)
        if (result.isNaN() || result.isInfinite()) "Error"
        else if (result == result.toLong().toDouble()) result.toLong().toString()
        else "%.6f".format(result).trimEnd('0').trimEnd('.')
    } catch (e: Exception) {
        ""
    }
}

private fun evalExpression(expr: String): Double {
    // Replace display symbols with ASCII operators
    val normalized = expr
        .replace("÷", "/")
        .replace("×", "*")

    // Tokenize into numbers and operators
    val tokens = mutableListOf<String>()
    var i = 0
    while (i < normalized.length) {
        val ch = normalized[i]
        if (ch.isDigit() || ch == '.') {
            val sb = StringBuilder()
            // Handle negative number at start or after operator
            while (i < normalized.length && (normalized[i].isDigit() || normalized[i] == '.')) {
                sb.append(normalized[i])
                i++
            }
            tokens.add(sb.toString())
        } else if (ch == '-' && (i == 0 || normalized[i - 1] in listOf('+', '-', '*', '/'))) {
            // Unary minus
            val sb = StringBuilder("-")
            i++
            while (i < normalized.length && (normalized[i].isDigit() || normalized[i] == '.')) {
                sb.append(normalized[i])
                i++
            }
            tokens.add(sb.toString())
        } else if (ch in listOf('+', '-', '*', '/')) {
            tokens.add(ch.toString())
            i++
        } else {
            i++
        }
    }

    if (tokens.isEmpty()) return 0.0

    // First pass: handle * and /
    val pass1 = mutableListOf<String>()
    var j = 0
    while (j < tokens.size) {
        val token = tokens[j]
        if (token == "*" || token == "/") {
            val left = pass1.removeLastOrNull()?.toDouble() ?: 0.0
            val right = tokens.getOrNull(j + 1)?.toDouble() ?: 0.0
            val res = if (token == "*") left * right else left / right
            pass1.add(res.toString())
            j += 2
        } else {
            pass1.add(token)
            j++
        }
    }

    // Second pass: handle + and -
    var result = pass1.firstOrNull()?.toDoubleOrNull() ?: 0.0
    var k = 1
    while (k < pass1.size) {
        val op = pass1[k]
        val num = pass1.getOrNull(k + 1)?.toDoubleOrNull() ?: 0.0
        result = when (op) {
            "+" -> result + num
            "-" -> result - num
            else -> result
        }
        k += 2
    }
    return result
}

private fun Char.isOperatorChar() = this in listOf('+', '-', '×', '÷', '*', '/')

private fun String.isNumeric(): Boolean =
    isEmpty() || matches(Regex("""^\d*\.?\d*$"""))

private fun String.isNumericInt(): Boolean =
    isEmpty() || matches(Regex("""^\d*$"""))

private fun formatCalcAmount(amount: Double): String {
    return if (amount == amount.toLong().toDouble()) amount.toLong().toString()
    else "%.2f".format(amount)
}
