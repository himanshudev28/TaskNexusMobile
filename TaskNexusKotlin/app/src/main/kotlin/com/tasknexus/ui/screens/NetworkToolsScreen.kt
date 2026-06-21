package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
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
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL
import java.net.URI

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NetworkToolsScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("IP Info", "URL Parser", "DNS Lookup")

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
            Text("Network Tools", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
        }

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
            0 -> IpInfoTab()
            1 -> UrlParserTab()
            2 -> DnsLookupTab()
        }
    }
}

@Composable
private fun IpInfoTab() {
    var ip by remember { mutableStateOf("") }
    var ipInfo by remember { mutableStateOf<Map<String, String>>(emptyMap()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val clipboard = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // IP Display
        Card(
            colors = CardDefaults.cardColors(containerColor = Surface2),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Your IP Address", color = OnSurface2, fontSize = 12.sp)
                    Spacer(Modifier.height(4.dp))
                    if (ip.isNotEmpty()) {
                        Text(ip, color = OnSurface, fontSize = 20.sp, fontWeight = FontWeight.Bold, fontFamily = FontFamily.Monospace)
                    } else {
                        Text("---", color = OnSurface3, fontSize = 20.sp, fontFamily = FontFamily.Monospace)
                    }
                }
                if (ip.isNotEmpty()) {
                    IconButton(onClick = { clipboard.setText(AnnotatedString(ip)) }) {
                        Icon(Icons.Default.ContentCopy, null, tint = OnSurface3)
                    }
                }
            }
        }

        Button(
            onClick = {
                scope.launch {
                    loading = true
                    error = ""
                    ipInfo = emptyMap()
                    try {
                        val fetchedIp = withContext(Dispatchers.IO) { fetchMyIp() }
                        ip = fetchedIp
                        val info = withContext(Dispatchers.IO) { fetchIpDetails(fetchedIp) }
                        ipInfo = info
                    } catch (e: Exception) {
                        error = e.message ?: "Failed to fetch IP"
                    }
                    loading = false
                }
            },
            enabled = !loading,
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.MyLocation, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Get My IP")
        }

        if (error.isNotEmpty()) {
            Card(
                colors = CardDefaults.cardColors(containerColor = Danger.copy(alpha = 0.1f)),
                shape = RoundedCornerShape(8.dp)
            ) {
                Row(
                    modifier = Modifier.padding(12.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(Icons.Default.ErrorOutline, null, Modifier.size(18.dp), tint = Danger)
                    Text(error, color = Danger, fontSize = 13.sp)
                }
            }
        }

        if (ipInfo.isNotEmpty()) {
            Text("IP Details", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

            Card(
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    ipInfo.entries.forEachIndexed { idx, (key, value) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(key, color = OnSurface2, fontSize = 12.sp, modifier = Modifier.width(100.dp))
                            Text(value, color = OnSurface, fontSize = 13.sp, fontWeight = FontWeight.Medium, modifier = Modifier.weight(1f))
                            IconButton(onClick = { clipboard.setText(AnnotatedString(value)) }, modifier = Modifier.size(28.dp)) {
                                Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp), tint = OnSurface3)
                            }
                        }
                        if (idx < ipInfo.size - 1) {
                            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderColor.copy(alpha = 0.5f), thickness = 0.5.dp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun UrlParserTab() {
    var urlInput by remember { mutableStateOf("https://example.com/path/to/page?key=value&foo=bar#section") }
    var parsed by remember { mutableStateOf<ParsedUrl?>(null) }
    var error by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = urlInput,
            onValueChange = { urlInput = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("URL") },
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Link, null, tint = OnSurface3) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        Button(
            onClick = {
                error = ""
                parsed = null
                try {
                    val uri = URI(urlInput.trim())
                    val queryParams = parseQueryParams(uri.query)
                    parsed = ParsedUrl(
                        protocol = uri.scheme ?: "",
                        host = uri.host ?: "",
                        port = if (uri.port != -1) uri.port.toString() else "(default)",
                        path = uri.path ?: "/",
                        fragment = uri.fragment ?: "",
                        queryParams = queryParams
                    )
                } catch (e: Exception) {
                    error = "Invalid URL: ${e.message}"
                }
            },
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.Search, null, Modifier.size(16.dp))
            Spacer(Modifier.width(8.dp))
            Text("Parse URL")
        }

        if (error.isNotEmpty()) {
            Text(error, color = Danger, fontSize = 12.sp)
        }

        parsed?.let { p ->
            // Basic info
            Text("Parsed Components", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

            Card(
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    listOf(
                        "Protocol" to p.protocol,
                        "Host" to p.host,
                        "Port" to p.port,
                        "Path" to p.path,
                        "Fragment" to p.fragment.ifEmpty { "(none)" }
                    ).forEachIndexed { idx, (label, value) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(label, color = OnSurface2, fontSize = 12.sp, modifier = Modifier.width(80.dp))
                            Text(value, color = OnSurface, fontSize = 13.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                            if (value != "(none)" && value != "(default)") {
                                IconButton(onClick = { clipboard.setText(AnnotatedString(value)) }, modifier = Modifier.size(28.dp)) {
                                    Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp), tint = OnSurface3)
                                }
                            }
                        }
                        if (idx < 4) HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderColor.copy(alpha = 0.5f), thickness = 0.5.dp)
                    }
                }
            }

            if (p.queryParams.isNotEmpty()) {
                Text("Query Parameters (${p.queryParams.size})", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                Card(
                    colors = CardDefaults.cardColors(containerColor = Surface2),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(4.dp)) {
                        // Header
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .background(Surface3)
                                .padding(horizontal = 16.dp, vertical = 8.dp)
                        ) {
                            Text("Key", color = OnSurface2, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                            Text("Value", color = OnSurface2, fontSize = 11.sp, fontWeight = FontWeight.SemiBold, modifier = Modifier.weight(1f))
                        }
                        p.queryParams.forEachIndexed { idx, (key, value) ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(horizontal = 16.dp, vertical = 8.dp)
                            ) {
                                Text(key, color = Info, fontSize = 12.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                                Text(value, color = OnSurface, fontSize = 12.sp, fontFamily = FontFamily.Monospace, modifier = Modifier.weight(1f))
                            }
                            if (idx < p.queryParams.size - 1) {
                                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderColor.copy(alpha = 0.5f), thickness = 0.5.dp)
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun DnsLookupTab() {
    var domain by remember { mutableStateOf("") }
    var recordType by remember { mutableStateOf("A") }
    var results by remember { mutableStateOf<List<DnsRecord>>(emptyList()) }
    var loading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()

    val recordTypes = listOf("A", "AAAA", "CNAME", "MX", "TXT", "NS", "SOA")

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        OutlinedTextField(
            value = domain,
            onValueChange = { domain = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Domain") },
            placeholder = { Text("example.com") },
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Dns, null, tint = OnSurface3) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        Text("Record Type", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
        Row(
            modifier = Modifier.horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(6.dp)
        ) {
            recordTypes.forEach { type ->
                FilterChip(
                    selected = recordType == type,
                    onClick = { recordType = type },
                    label = { Text(type, fontSize = 12.sp) },
                    colors = FilterChipDefaults.filterChipColors(
                        selectedContainerColor = Primary.copy(alpha = 0.15f),
                        selectedLabelColor = Primary
                    )
                )
            }
        }

        Button(
            onClick = {
                if (domain.isBlank()) return@Button
                scope.launch {
                    loading = true
                    error = ""
                    results = emptyList()
                    try {
                        val r = withContext(Dispatchers.IO) { dnsLookup(domain.trim(), recordType) }
                        results = r
                    } catch (e: Exception) {
                        error = e.message ?: "Lookup failed"
                    }
                    loading = false
                }
            },
            enabled = !loading && domain.isNotBlank(),
            colors = ButtonDefaults.buttonColors(containerColor = Primary),
            modifier = Modifier.fillMaxWidth()
        ) {
            if (loading) {
                CircularProgressIndicator(modifier = Modifier.size(16.dp), color = OnSurface, strokeWidth = 2.dp)
                Spacer(Modifier.width(8.dp))
            } else {
                Icon(Icons.Default.Search, null, Modifier.size(16.dp))
                Spacer(Modifier.width(8.dp))
            }
            Text("Lookup")
        }

        if (error.isNotEmpty()) {
            Text(error, color = Danger, fontSize = 12.sp)
        }

        if (results.isNotEmpty()) {
            Text("$recordType Records (${results.size})", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

            Card(
                colors = CardDefaults.cardColors(containerColor = Surface2),
                shape = RoundedCornerShape(12.dp)
            ) {
                Column(modifier = Modifier.padding(4.dp)) {
                    results.forEachIndexed { idx, record ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 10.dp),
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            Text(record.data, color = OnSurface, fontSize = 13.sp, fontFamily = FontFamily.Monospace)
                            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Text("TTL: ${record.ttl}s", color = OnSurface3, fontSize = 11.sp)
                                Text("Type: ${record.type}", color = Info, fontSize = 11.sp)
                            }
                        }
                        if (idx < results.size - 1) {
                            HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp), color = BorderColor.copy(alpha = 0.5f), thickness = 0.5.dp)
                        }
                    }
                }
            }
        }
    }
}

data class ParsedUrl(
    val protocol: String,
    val host: String,
    val port: String,
    val path: String,
    val fragment: String,
    val queryParams: List<Pair<String, String>>
)

data class DnsRecord(
    val type: String,
    val data: String,
    val ttl: Int
)

private fun parseQueryParams(query: String?): List<Pair<String, String>> {
    if (query.isNullOrEmpty()) return emptyList()
    return query.split("&").mapNotNull { param ->
        val parts = param.split("=", limit = 2)
        if (parts.size == 2) parts[0] to parts[1]
        else if (parts.size == 1) parts[0] to ""
        else null
    }
}

private fun fetchMyIp(): String {
    val url = URL("https://api.ipify.org?format=json")
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = 8000
    conn.readTimeout = 8000
    val response = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    return JSONObject(response).getString("ip")
}

private fun fetchIpDetails(ip: String): Map<String, String> {
    val url = URL("https://ipapi.co/$ip/json/")
    val conn = url.openConnection() as HttpURLConnection
    conn.setRequestProperty("User-Agent", "Mozilla/5.0")
    conn.connectTimeout = 8000
    conn.readTimeout = 8000
    val response = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    val json = JSONObject(response)

    return linkedMapOf(
        "IP" to json.optString("ip", "-"),
        "City" to json.optString("city", "-"),
        "Region" to json.optString("region", "-"),
        "Country" to "${json.optString("country_name", "-")} (${json.optString("country_code", "-")})",
        "Postal" to json.optString("postal", "-"),
        "ISP" to json.optString("org", "-"),
        "Timezone" to json.optString("timezone", "-"),
        "Latitude" to json.optString("latitude", "-"),
        "Longitude" to json.optString("longitude", "-")
    )
}

private fun dnsLookup(domain: String, type: String): List<DnsRecord> {
    val typeMap = mapOf("A" to 1, "AAAA" to 28, "CNAME" to 5, "MX" to 15, "TXT" to 16, "NS" to 2, "SOA" to 6)
    val typeNum = typeMap[type] ?: 1
    val url = URL("https://dns.google/resolve?name=$domain&type=$typeNum")
    val conn = url.openConnection() as HttpURLConnection
    conn.connectTimeout = 8000
    conn.readTimeout = 8000
    val response = BufferedReader(InputStreamReader(conn.inputStream)).use { it.readText() }
    val json = JSONObject(response)
    val answers = json.optJSONArray("Answer") ?: return emptyList()

    return (0 until answers.length()).map { i ->
        val ans = answers.getJSONObject(i)
        DnsRecord(
            type = type,
            data = ans.optString("data", "-"),
            ttl = ans.optInt("TTL", 0)
        )
    }
}
