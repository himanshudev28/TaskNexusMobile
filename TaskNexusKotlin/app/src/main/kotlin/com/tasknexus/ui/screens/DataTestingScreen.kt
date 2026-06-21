package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.random.Random

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DataTestingScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("REST Client", "Mock Data")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(Surface)
                .padding(horizontal = 20.dp, vertical = 16.dp)
        ) {
            Text(
                text = "Data Testing",
                style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold)
            )
        }

        TabRow(
            selectedTabIndex = selectedTab,
            containerColor = Surface,
            contentColor = Primary
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
            0 -> RestClientTab()
            1 -> MockDataTab()
        }
    }
}

data class HeaderPair(val key: String = "", val value: String = "")

@Composable
private fun RestClientTab() {
    var method by remember { mutableStateOf("GET") }
    var url by remember { mutableStateOf("https://jsonplaceholder.typicode.com/posts/1") }
    var headers by remember { mutableStateOf(listOf(HeaderPair("Content-Type", "application/json"))) }
    var body by remember { mutableStateOf("") }
    var responseStatus by remember { mutableStateOf("") }
    var responseTime by remember { mutableStateOf("") }
    var responseBody by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    val methods = listOf("GET", "POST", "PUT", "DELETE", "PATCH")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Method + URL
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            var methodExpanded by remember { mutableStateOf(false) }
            Box {
                OutlinedButton(
                    onClick = { methodExpanded = true },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = methodColor(method)),
                    border = ButtonDefaults.outlinedButtonBorder.copy()
                ) {
                    Text(method, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                    Icon(Icons.Default.ArrowDropDown, null, Modifier.size(16.dp))
                }
                DropdownMenu(
                    expanded = methodExpanded,
                    onDismissRequest = { methodExpanded = false },
                    modifier = Modifier.background(Surface2)
                ) {
                    methods.forEach { m ->
                        DropdownMenuItem(
                            text = { Text(m, color = methodColor(m), fontWeight = FontWeight.SemiBold) },
                            onClick = { method = m; methodExpanded = false }
                        )
                    }
                }
            }

            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                modifier = Modifier.weight(1f),
                singleLine = true,
                placeholder = { Text("https://...") },
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary,
                    unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface,
                    unfocusedTextColor = OnSurface
                ),
                textStyle = TextStyle(fontSize = 13.sp)
            )
        }

        // Headers
        Text("Headers", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        headers.forEachIndexed { idx, h ->
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                OutlinedTextField(
                    value = h.key,
                    onValueChange = { k -> headers = headers.toMutableList().also { it[idx] = h.copy(key = k) } },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    placeholder = { Text("Key") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                        focusedTextColor = OnSurface, unfocusedTextColor = OnSurface
                    ),
                    textStyle = TextStyle(fontSize = 12.sp)
                )
                OutlinedTextField(
                    value = h.value,
                    onValueChange = { v -> headers = headers.toMutableList().also { it[idx] = h.copy(value = v) } },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    placeholder = { Text("Value") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                        focusedTextColor = OnSurface, unfocusedTextColor = OnSurface
                    ),
                    textStyle = TextStyle(fontSize = 12.sp)
                )
                IconButton(onClick = { headers = headers.toMutableList().also { it.removeAt(idx) } }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.Close, null, Modifier.size(16.dp), tint = Danger)
                }
            }
        }
        TextButton(
            onClick = { headers = headers + HeaderPair() },
            colors = ButtonDefaults.textButtonColors(contentColor = Primary)
        ) {
            Icon(Icons.Default.Add, null, Modifier.size(14.dp))
            Spacer(Modifier.width(4.dp))
            Text("Add Header", fontSize = 12.sp)
        }

        // Body
        if (method in listOf("POST", "PUT", "PATCH")) {
            OutlinedTextField(
                value = body,
                onValueChange = { body = it },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(100.dp),
                label = { Text("Body (JSON)") },
                textStyle = TextStyle(fontFamily = FontFamily.Monospace, fontSize = 12.sp, color = OnSurface),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )
        }

        // Send Button
        Button(
            onClick = {
                scope.launch {
                    loading = true
                    responseBody = ""
                    responseStatus = ""
                    responseTime = ""
                    val start = System.currentTimeMillis()
                    try {
                        val result = withContext(Dispatchers.IO) {
                            performRequest(method, url, headers, body)
                        }
                        val elapsed = System.currentTimeMillis() - start
                        responseStatus = result.first
                        responseBody = result.second
                        responseTime = "${elapsed}ms"
                    } catch (e: Exception) {
                        responseStatus = "Error"
                        responseBody = e.message ?: "Unknown error"
                        responseTime = ""
                    }
                    loading = false
                }
            },
            enabled = !loading && url.isNotEmpty(),
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.Send, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Send Request")
        }

        // Response
        if (responseStatus.isNotEmpty() || responseBody.isNotEmpty()) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                val code = responseStatus.filter { it.isDigit() }.toIntOrNull() ?: 0
                AssistChip(
                    onClick = {},
                    label = { Text(responseStatus) },
                    colors = AssistChipDefaults.assistChipColors(
                        containerColor = when {
                            code in 200..299 -> Success.copy(alpha = 0.15f)
                            code in 400..499 -> Warning.copy(alpha = 0.15f)
                            code >= 500 -> Danger.copy(alpha = 0.15f)
                            else -> Surface3
                        },
                        labelColor = when {
                            code in 200..299 -> Success
                            code in 400..499 -> Warning
                            code >= 500 -> Danger
                            else -> OnSurface2
                        }
                    )
                )
                if (responseTime.isNotEmpty()) {
                    Text(responseTime, color = OnSurface3, fontSize = 12.sp)
                }
                Spacer(Modifier.weight(1f))
                IconButton(onClick = { clipboard.setText(AnnotatedString(responseBody)) }, modifier = Modifier.size(32.dp)) {
                    Icon(Icons.Default.ContentCopy, null, Modifier.size(16.dp), tint = OnSurface3)
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Surface2)
                    .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = responseBody,
                    color = OnSurface,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.verticalScroll(rememberScrollState())
                )
            }
        }
    }
}

@Composable
private fun MockDataTab() {
    var entityType by remember { mutableStateOf("User") }
    var count by remember { mutableStateOf(3) }
    var output by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current
    val entityTypes = listOf("User", "Product", "Order", "Post")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Entity Type", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            entityTypes.forEach { type ->
                FilterChip(
                    selected = entityType == type,
                    onClick = { entityType = type },
                    label = { Text(type) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Primary.copy(alpha = 0.15f),
                        selectedLabelColor = Primary
                    )
                )
            }
        }

        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text("Count: $count", color = OnSurface2, fontSize = 13.sp, modifier = Modifier.width(70.dp))
            Slider(
                value = count.toFloat(),
                onValueChange = { count = it.toInt() },
                valueRange = 1f..20f,
                modifier = Modifier.weight(1f),
                colors = SliderDefaults.colors(thumbColor = Primary, activeTrackColor = Primary, inactiveTrackColor = Surface3)
            )
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            Button(
                onClick = {
                    val arr = JSONArray()
                    repeat(count) { arr.put(generateMockEntity(entityType)) }
                    output = arr.toString(2)
                },
                colors = ButtonDefaults.buttonColors(containerColor = Primary),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.AutoAwesome, null, Modifier.size(16.dp))
                Spacer(Modifier.width(6.dp))
                Text("Generate")
            }
            if (output.isNotEmpty()) {
                OutlinedButton(
                    onClick = { clipboard.setText(AnnotatedString(output)) },
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
                ) {
                    Icon(Icons.Default.ContentCopy, null, Modifier.size(16.dp))
                    Spacer(Modifier.width(6.dp))
                    Text("Copy")
                }
            }
        }

        if (output.isNotEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f)
                    .clip(RoundedCornerShape(10.dp))
                    .background(Surface2)
                    .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = output,
                    color = OnSurface,
                    fontSize = 12.sp,
                    fontFamily = FontFamily.Monospace,
                    modifier = Modifier.verticalScroll(rememberScrollState())
                )
            }
        }
    }
}

private fun methodColor(method: String): androidx.compose.ui.graphics.Color = when (method) {
    "GET" -> Success
    "POST" -> Info
    "PUT" -> Warning
    "DELETE" -> Danger
    "PATCH" -> Accent
    else -> OnSurface
}

private fun performRequest(method: String, urlStr: String, headers: List<HeaderPair>, body: String): Pair<String, String> {
    val url = URL(urlStr)
    val conn = url.openConnection() as HttpURLConnection
    conn.requestMethod = method
    conn.connectTimeout = 10000
    conn.readTimeout = 10000
    headers.filter { it.key.isNotEmpty() }.forEach { conn.setRequestProperty(it.key, it.value) }

    if (method in listOf("POST", "PUT", "PATCH") && body.isNotEmpty()) {
        conn.doOutput = true
        OutputStreamWriter(conn.outputStream).use { it.write(body) }
    }

    val code = conn.responseCode
    val stream = if (code < 400) conn.inputStream else conn.errorStream
    val response = BufferedReader(InputStreamReader(stream)).use { it.readText() }

    val formatted = try {
        when (val token = org.json.JSONTokener(response).nextValue()) {
            is JSONObject -> token.toString(2)
            is JSONArray -> token.toString(2)
            else -> response
        }
    } catch (e: Exception) { response }

    return "$code ${getStatusText(code)}" to formatted
}

private fun getStatusText(code: Int) = when (code) {
    200 -> "OK"; 201 -> "Created"; 204 -> "No Content"
    400 -> "Bad Request"; 401 -> "Unauthorized"; 403 -> "Forbidden"
    404 -> "Not Found"; 500 -> "Internal Server Error"
    else -> ""
}

private val firstNames = listOf("Alice", "Bob", "Carol", "Dave", "Eve", "Frank", "Grace", "Henry")
private val lastNames = listOf("Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller")
private val products = listOf("Laptop", "Phone", "Tablet", "Monitor", "Keyboard", "Mouse", "Headphones")
private val statuses = listOf("pending", "processing", "shipped", "delivered", "cancelled")

private fun generateMockEntity(type: String): JSONObject = JSONObject().apply {
    val id = Random.nextInt(1000, 9999)
    when (type) {
        "User" -> {
            val first = firstNames.random()
            val last = lastNames.random()
            put("id", id)
            put("name", "$first $last")
            put("email", "${first.lowercase()}.${last.lowercase()}@example.com")
            put("phone", "+1-${Random.nextInt(200,999)}-${Random.nextInt(100,999)}-${Random.nextInt(1000,9999)}")
            put("age", Random.nextInt(18, 65))
            put("city", listOf("New York","London","Tokyo","Paris","Sydney").random())
            put("active", Random.nextBoolean())
        }
        "Product" -> {
            put("id", id)
            put("name", "${listOf("Pro","Ultra","Basic","Smart","Eco").random()} ${products.random()}")
            put("price", "%.2f".format(Random.nextDouble(9.99, 999.99)))
            put("stock", Random.nextInt(0, 500))
            put("category", listOf("Electronics","Accessories","Office","Gaming").random())
            put("rating", "%.1f".format(Random.nextDouble(2.0, 5.0)))
            put("sku", "SKU-$id-${Random.nextInt(10,99)}")
        }
        "Order" -> {
            put("id", "ORD-$id")
            put("userId", Random.nextInt(100, 999))
            put("product", products.random())
            put("quantity", Random.nextInt(1, 10))
            put("total", "%.2f".format(Random.nextDouble(19.99, 1999.99)))
            put("status", statuses.random())
            put("date", "2025-${Random.nextInt(1,12).toString().padStart(2,'0')}-${Random.nextInt(1,28).toString().padStart(2,'0')}")
        }
        "Post" -> {
            put("id", id)
            put("userId", Random.nextInt(1, 100))
            put("title", listOf(
                "Getting started with Android", "Understanding Kotlin coroutines",
                "Compose UI best practices", "REST API design patterns"
            ).random())
            put("body", "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.")
            put("likes", Random.nextInt(0, 10000))
            put("comments", Random.nextInt(0, 500))
            put("tags", JSONArray(listOf("android","kotlin","compose","api").shuffled().take(2)))
        }
    }
}
