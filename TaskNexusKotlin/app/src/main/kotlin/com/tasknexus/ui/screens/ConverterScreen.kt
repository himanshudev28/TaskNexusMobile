package com.tasknexus.ui.screens

import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.SwapHoriz
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

private enum class ConverterCategory(val label: String) {
    LENGTH("Length"),
    WEIGHT("Weight"),
    TEMPERATURE("Temperature"),
    SPEED("Speed"),
    VOLUME("Volume"),
    AREA("Area"),
    DIGITAL("Digital")
}

private val unitsByCategory: Map<ConverterCategory, List<String>> = mapOf(
    ConverterCategory.LENGTH to listOf("Meter", "Kilometer", "Mile", "Foot", "Inch", "Yard", "Centimeter", "Millimeter"),
    ConverterCategory.WEIGHT to listOf("Kilogram", "Gram", "Pound", "Ounce", "Ton", "Milligram"),
    ConverterCategory.TEMPERATURE to listOf("Celsius", "Fahrenheit", "Kelvin"),
    ConverterCategory.SPEED to listOf("m/s", "km/h", "mph", "knot", "ft/s"),
    ConverterCategory.VOLUME to listOf("Liter", "Milliliter", "Gallon (US)", "Quart", "Pint", "Cup", "Fluid Ounce", "Cubic Meter"),
    ConverterCategory.AREA to listOf("Square Meter", "Square Kilometer", "Square Mile", "Square Foot", "Square Inch", "Acre", "Hectare"),
    ConverterCategory.DIGITAL to listOf("Bit", "Byte", "Kilobyte", "Megabyte", "Gigabyte", "Terabyte", "Petabyte")
)

// Convert everything to a base unit then back.
// Base: Meter, Kilogram, Celsius (handled separately), m/s, Liter, Square Meter, Bit

private fun toBase(value: Double, unit: String, category: ConverterCategory): Double = when (category) {
    ConverterCategory.LENGTH -> when (unit) {
        "Meter" -> value
        "Kilometer" -> value * 1000.0
        "Mile" -> value * 1609.344
        "Foot" -> value * 0.3048
        "Inch" -> value * 0.0254
        "Yard" -> value * 0.9144
        "Centimeter" -> value * 0.01
        "Millimeter" -> value * 0.001
        else -> value
    }
    ConverterCategory.WEIGHT -> when (unit) {
        "Kilogram" -> value
        "Gram" -> value / 1000.0
        "Pound" -> value * 0.453592
        "Ounce" -> value * 0.0283495
        "Ton" -> value * 1000.0
        "Milligram" -> value / 1_000_000.0
        else -> value
    }
    ConverterCategory.SPEED -> when (unit) {
        "m/s" -> value
        "km/h" -> value / 3.6
        "mph" -> value * 0.44704
        "knot" -> value * 0.514444
        "ft/s" -> value * 0.3048
        else -> value
    }
    ConverterCategory.VOLUME -> when (unit) {
        "Liter" -> value
        "Milliliter" -> value / 1000.0
        "Gallon (US)" -> value * 3.78541
        "Quart" -> value * 0.946353
        "Pint" -> value * 0.473176
        "Cup" -> value * 0.236588
        "Fluid Ounce" -> value * 0.0295735
        "Cubic Meter" -> value * 1000.0
        else -> value
    }
    ConverterCategory.AREA -> when (unit) {
        "Square Meter" -> value
        "Square Kilometer" -> value * 1_000_000.0
        "Square Mile" -> value * 2_589_988.11
        "Square Foot" -> value * 0.092903
        "Square Inch" -> value * 0.00064516
        "Acre" -> value * 4046.86
        "Hectare" -> value * 10_000.0
        else -> value
    }
    ConverterCategory.DIGITAL -> when (unit) {
        "Bit" -> value
        "Byte" -> value * 8.0
        "Kilobyte" -> value * 8.0 * 1024
        "Megabyte" -> value * 8.0 * 1024 * 1024
        "Gigabyte" -> value * 8.0 * 1024 * 1024 * 1024
        "Terabyte" -> value * 8.0 * 1024 * 1024 * 1024 * 1024
        "Petabyte" -> value * 8.0 * 1024 * 1024 * 1024 * 1024 * 1024
        else -> value
    }
    ConverterCategory.TEMPERATURE -> value // handled separately
}

private fun fromBase(value: Double, unit: String, category: ConverterCategory): Double = when (category) {
    ConverterCategory.LENGTH -> when (unit) {
        "Meter" -> value
        "Kilometer" -> value / 1000.0
        "Mile" -> value / 1609.344
        "Foot" -> value / 0.3048
        "Inch" -> value / 0.0254
        "Yard" -> value / 0.9144
        "Centimeter" -> value / 0.01
        "Millimeter" -> value / 0.001
        else -> value
    }
    ConverterCategory.WEIGHT -> when (unit) {
        "Kilogram" -> value
        "Gram" -> value * 1000.0
        "Pound" -> value / 0.453592
        "Ounce" -> value / 0.0283495
        "Ton" -> value / 1000.0
        "Milligram" -> value * 1_000_000.0
        else -> value
    }
    ConverterCategory.SPEED -> when (unit) {
        "m/s" -> value
        "km/h" -> value * 3.6
        "mph" -> value / 0.44704
        "knot" -> value / 0.514444
        "ft/s" -> value / 0.3048
        else -> value
    }
    ConverterCategory.VOLUME -> when (unit) {
        "Liter" -> value
        "Milliliter" -> value * 1000.0
        "Gallon (US)" -> value / 3.78541
        "Quart" -> value / 0.946353
        "Pint" -> value / 0.473176
        "Cup" -> value / 0.236588
        "Fluid Ounce" -> value / 0.0295735
        "Cubic Meter" -> value / 1000.0
        else -> value
    }
    ConverterCategory.AREA -> when (unit) {
        "Square Meter" -> value
        "Square Kilometer" -> value / 1_000_000.0
        "Square Mile" -> value / 2_589_988.11
        "Square Foot" -> value / 0.092903
        "Square Inch" -> value / 0.00064516
        "Acre" -> value / 4046.86
        "Hectare" -> value / 10_000.0
        else -> value
    }
    ConverterCategory.DIGITAL -> when (unit) {
        "Bit" -> value
        "Byte" -> value / 8.0
        "Kilobyte" -> value / (8.0 * 1024)
        "Megabyte" -> value / (8.0 * 1024 * 1024)
        "Gigabyte" -> value / (8.0 * 1024 * 1024 * 1024)
        "Terabyte" -> value / (8.0 * 1024 * 1024 * 1024 * 1024)
        "Petabyte" -> value / (8.0 * 1024 * 1024 * 1024 * 1024 * 1024)
        else -> value
    }
    ConverterCategory.TEMPERATURE -> value // handled separately
}

private fun convertTemperature(value: Double, from: String, to: String): Double {
    val celsius = when (from) {
        "Celsius" -> value
        "Fahrenheit" -> (value - 32) * 5.0 / 9.0
        "Kelvin" -> value - 273.15
        else -> value
    }
    return when (to) {
        "Celsius" -> celsius
        "Fahrenheit" -> celsius * 9.0 / 5.0 + 32
        "Kelvin" -> celsius + 273.15
        else -> celsius
    }
}

private fun convert(value: Double, from: String, to: String, category: ConverterCategory): Double {
    if (from == to) return value
    return if (category == ConverterCategory.TEMPERATURE) {
        convertTemperature(value, from, to)
    } else {
        fromBase(toBase(value, from, category), to, category)
    }
}

private fun formatResult(value: Double): String {
    if (value.isNaN() || value.isInfinite()) return "—"
    return if (value == kotlin.math.floor(value) && value < 1e12) {
        value.toLong().toString()
    } else {
        "%.6g".format(value).trimEnd('0').trimEnd('.')
    }
}

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConverterScreen() {
    var selectedCategory by remember { mutableStateOf(ConverterCategory.LENGTH) }
    var inputValue by remember { mutableStateOf("") }

    val units = unitsByCategory[selectedCategory] ?: emptyList()
    var fromUnit by remember { mutableStateOf(units.first()) }
    var toUnit by remember { mutableStateOf(units.getOrElse(1) { units.first() }) }

    // Reset units when category changes
    LaunchedEffect(selectedCategory) {
        val u = unitsByCategory[selectedCategory] ?: emptyList()
        fromUnit = u.firstOrNull() ?: ""
        toUnit = u.getOrElse(1) { u.firstOrNull() ?: "" }
    }

    val result = remember(inputValue, fromUnit, toUnit, selectedCategory) {
        val d = inputValue.toDoubleOrNull()
        if (d != null) formatResult(convert(d, fromUnit, toUnit, selectedCategory)) else "—"
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text("Unit Converter", fontSize = 24.sp, fontWeight = FontWeight.Bold)

        // Category chip row
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            ConverterCategory.values().forEach { cat ->
                FilterChip(
                    selected = selectedCategory == cat,
                    onClick = { selectedCategory = cat; inputValue = "" },
                    label = { Text(cat.label) }
                )
            }
        }

        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(2.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // From value input
                OutlinedTextField(
                    value = inputValue,
                    onValueChange = { inputValue = it },
                    label = { Text("Value") },
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                // From unit dropdown
                UnitDropdown(
                    label = "From",
                    selected = fromUnit,
                    options = units,
                    onSelected = { fromUnit = it }
                )

                // Swap button
                Box(modifier = Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                    FilledTonalIconButton(onClick = {
                        val tmp = fromUnit
                        fromUnit = toUnit
                        toUnit = tmp
                    }) {
                        Icon(Icons.Default.SwapHoriz, contentDescription = "Swap")
                    }
                }

                // To unit dropdown
                UnitDropdown(
                    label = "To",
                    selected = toUnit,
                    options = units,
                    onSelected = { toUnit = it }
                )

                // Result
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer,
                    shape = MaterialTheme.shapes.medium,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Result",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                        Spacer(Modifier.height(4.dp))
                        Text(
                            text = if (result == "—") "—" else "$result $toUnit",
                            style = MaterialTheme.typography.headlineMedium,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onPrimaryContainer
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun UnitDropdown(
    label: String,
    selected: String,
    options: List<String>,
    onSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(
        expanded = expanded,
        onExpandedChange = { expanded = it }
    ) {
        OutlinedTextField(
            value = selected,
            onValueChange = {},
            readOnly = true,
            label = { Text(label) },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            options.forEach { opt ->
                DropdownMenuItem(
                    text = { Text(opt) },
                    onClick = { onSelected(opt); expanded = false }
                )
            }
        }
    }
}
