package com.tasknexus.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.itemsIndexed
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.tasknexus.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SEOToolsScreen() {
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Meta Tags", "Robots.txt")

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
            Text("SEO Tools", style = TextStyle(color = OnSurface, fontSize = 22.sp, fontWeight = FontWeight.Bold))
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
            0 -> MetaTagsTab()
            1 -> RobotsTab()
        }
    }
}

@Composable
private fun MetaTagsTab() {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var keywords by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("") }
    var ogImage by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    val titleLimit = 60
    val descLimit = 160

    val generatedHtml = buildString {
        appendLine("<!-- Primary Meta Tags -->")
        if (title.isNotEmpty()) appendLine("<title>$title</title>")
        if (title.isNotEmpty()) appendLine("<meta name=\"title\" content=\"$title\" />")
        if (description.isNotEmpty()) appendLine("<meta name=\"description\" content=\"$description\" />")
        if (keywords.isNotEmpty()) appendLine("<meta name=\"keywords\" content=\"$keywords\" />")
        if (author.isNotEmpty()) appendLine("<meta name=\"author\" content=\"$author\" />")
        if (title.isNotEmpty() || description.isNotEmpty() || ogImage.isNotEmpty()) {
            appendLine()
            appendLine("<!-- Open Graph / Facebook -->")
            appendLine("<meta property=\"og:type\" content=\"website\" />")
            if (title.isNotEmpty()) appendLine("<meta property=\"og:title\" content=\"$title\" />")
            if (description.isNotEmpty()) appendLine("<meta property=\"og:description\" content=\"$description\" />")
            if (ogImage.isNotEmpty()) appendLine("<meta property=\"og:image\" content=\"$ogImage\" />")
            appendLine()
            appendLine("<!-- Twitter -->")
            appendLine("<meta property=\"twitter:card\" content=\"summary_large_image\" />")
            if (title.isNotEmpty()) appendLine("<meta property=\"twitter:title\" content=\"$title\" />")
            if (description.isNotEmpty()) appendLine("<meta property=\"twitter:description\" content=\"$description\" />")
            if (ogImage.isNotEmpty()) appendLine("<meta property=\"twitter:image\" content=\"$ogImage\" />")
        }
    }.trim()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        // Title
        Column {
            OutlinedTextField(
                value = title,
                onValueChange = { if (it.length <= titleLimit + 10) title = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Page Title") },
                singleLine = true,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = if (title.length > titleLimit) Danger else Primary,
                    unfocusedBorderColor = if (title.length > titleLimit) Danger else BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (title.length > titleLimit) {
                    Text("Over limit by ${title.length - titleLimit} chars", color = Danger, fontSize = 11.sp)
                } else {
                    Text("Recommended: 50-60 chars", color = OnSurface3, fontSize = 11.sp)
                }
                Text(
                    "${title.length}/$titleLimit",
                    color = if (title.length > titleLimit) Danger else OnSurface3,
                    fontSize = 11.sp
                )
            }
        }

        // Description
        Column {
            OutlinedTextField(
                value = description,
                onValueChange = { if (it.length <= descLimit + 20) description = it },
                modifier = Modifier.fillMaxWidth(),
                label = { Text("Meta Description") },
                minLines = 2,
                maxLines = 4,
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = if (description.length > descLimit) Danger else Primary,
                    unfocusedBorderColor = if (description.length > descLimit) Danger else BorderColor,
                    focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                    focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
                )
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (description.length > descLimit) {
                    Text("Over limit by ${description.length - descLimit} chars", color = Danger, fontSize = 11.sp)
                } else {
                    Text("Recommended: 150-160 chars", color = OnSurface3, fontSize = 11.sp)
                }
                Text(
                    "${description.length}/$descLimit",
                    color = if (description.length > descLimit) Danger else OnSurface3,
                    fontSize = 11.sp
                )
            }
        }

        OutlinedTextField(
            value = keywords,
            onValueChange = { keywords = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Keywords (comma separated)") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        OutlinedTextField(
            value = author,
            onValueChange = { author = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Author") },
            singleLine = true,
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        OutlinedTextField(
            value = ogImage,
            onValueChange = { ogImage = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("OG Image URL") },
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Image, null, tint = OnSurface3) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        // Google SERP Preview
        if (title.isNotEmpty() || description.isNotEmpty()) {
            Text("Google SERP Preview", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            Card(
                colors = CardDefaults.cardColors(containerColor = Color.White),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                    Text(
                        text = "example.com",
                        color = Color(0xFF202124),
                        fontSize = 12.sp
                    )
                    Text(
                        text = title.ifEmpty { "Page Title" },
                        color = Color(0xFF1A0DAB),
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Normal,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = description.ifEmpty { "Page description will appear here..." },
                        color = Color(0xFF4D5156),
                        fontSize = 13.sp,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }
        }

        // Generated HTML
        if (generatedHtml.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Generated HTML", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
                OutlinedButton(
                    onClick = { clipboard.setText(AnnotatedString(generatedHtml)) },
                    contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                    modifier = Modifier.height(32.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
                ) {
                    Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp))
                    Spacer(Modifier.width(4.dp))
                    Text("Copy", fontSize = 12.sp)
                }
            }

            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(RoundedCornerShape(10.dp))
                    .background(Surface2)
                    .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                    .padding(12.dp)
            ) {
                Text(
                    text = generatedHtml,
                    color = OnSurface,
                    fontSize = 11.sp,
                    fontFamily = FontFamily.Monospace,
                    lineHeight = 18.sp
                )
            }
        }
    }
}

@Composable
private fun RobotsTab() {
    var rules by remember { mutableStateOf(listOf(
        RobotsRule("Allow", "/"),
        RobotsRule("Disallow", "/admin")
    )) }
    var sitemapUrl by remember { mutableStateOf("") }
    val clipboard = LocalClipboardManager.current

    val generated = buildString {
        appendLine("User-agent: *")
        rules.forEach { rule ->
            if (rule.path.isNotEmpty()) {
                appendLine("${rule.type}: ${rule.path}")
            }
        }
        if (sitemapUrl.isNotEmpty()) {
            appendLine()
            appendLine("Sitemap: $sitemapUrl")
        }
    }.trim()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Rules", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)

        rules.forEachIndexed { index, rule ->
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                var typeExpanded by remember { mutableStateOf(false) }
                Box(modifier = Modifier.width(120.dp)) {
                    OutlinedButton(
                        onClick = { typeExpanded = true },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.outlinedButtonColors(
                            contentColor = if (rule.type == "Allow") Success else Danger
                        )
                    ) {
                        Text(rule.type, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                        Icon(Icons.Default.ArrowDropDown, null, Modifier.size(14.dp))
                    }
                    DropdownMenu(
                        expanded = typeExpanded,
                        onDismissRequest = { typeExpanded = false },
                        modifier = Modifier.background(Surface2)
                    ) {
                        DropdownMenuItem(
                            text = { Text("Allow", color = Success) },
                            onClick = {
                                rules = rules.toMutableList().also { it[index] = it[index].copy(type = "Allow") }
                                typeExpanded = false
                            }
                        )
                        DropdownMenuItem(
                            text = { Text("Disallow", color = Danger) },
                            onClick = {
                                rules = rules.toMutableList().also { it[index] = it[index].copy(type = "Disallow") }
                                typeExpanded = false
                            }
                        )
                    }
                }

                OutlinedTextField(
                    value = rule.path,
                    onValueChange = { path ->
                        rules = rules.toMutableList().also { it[index] = it[index].copy(path = path) }
                    },
                    modifier = Modifier.weight(1f),
                    singleLine = true,
                    placeholder = { Text("/path") },
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                        focusedTextColor = OnSurface, unfocusedTextColor = OnSurface
                    )
                )

                IconButton(
                    onClick = { rules = rules.toMutableList().also { it.removeAt(index) } },
                    modifier = Modifier.size(36.dp)
                ) {
                    Icon(Icons.Default.Delete, null, Modifier.size(18.dp), tint = Danger)
                }
            }
        }

        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            TextButton(
                onClick = { rules = rules + RobotsRule("Allow", "") },
                colors = ButtonDefaults.textButtonColors(contentColor = Success)
            ) {
                Icon(Icons.Default.Add, null, Modifier.size(14.dp))
                Spacer(Modifier.width(4.dp))
                Text("Allow", fontSize = 12.sp)
            }
            TextButton(
                onClick = { rules = rules + RobotsRule("Disallow", "") },
                colors = ButtonDefaults.textButtonColors(contentColor = Danger)
            ) {
                Icon(Icons.Default.Add, null, Modifier.size(14.dp))
                Spacer(Modifier.width(4.dp))
                Text("Disallow", fontSize = 12.sp)
            }
        }

        OutlinedTextField(
            value = sitemapUrl,
            onValueChange = { sitemapUrl = it },
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Sitemap URL") },
            placeholder = { Text("https://example.com/sitemap.xml") },
            singleLine = true,
            leadingIcon = { Icon(Icons.Default.Map, null, tint = OnSurface3) },
            colors = OutlinedTextFieldDefaults.colors(
                focusedBorderColor = Primary, unfocusedBorderColor = BorderColor,
                focusedTextColor = OnSurface, unfocusedTextColor = OnSurface,
                focusedLabelColor = Primary, unfocusedLabelColor = OnSurface3
            )
        )

        HorizontalDivider(color = BorderColor, thickness = 1.dp)

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text("Generated robots.txt", color = OnSurface2, fontSize = 12.sp, fontWeight = FontWeight.Medium)
            OutlinedButton(
                onClick = { clipboard.setText(AnnotatedString(generated)) },
                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 4.dp),
                modifier = Modifier.height(32.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = Primary)
            ) {
                Icon(Icons.Default.ContentCopy, null, Modifier.size(14.dp))
                Spacer(Modifier.width(4.dp))
                Text("Copy", fontSize = 12.sp)
            }
        }

        Box(
            modifier = Modifier
                .fillMaxWidth()
                .clip(RoundedCornerShape(10.dp))
                .background(Surface2)
                .border(1.dp, BorderColor, RoundedCornerShape(10.dp))
                .padding(16.dp)
        ) {
            Text(
                text = generated,
                color = OnSurface,
                fontSize = 13.sp,
                fontFamily = FontFamily.Monospace,
                lineHeight = 22.sp
            )
        }
    }
}

data class RobotsRule(val type: String, val path: String)
