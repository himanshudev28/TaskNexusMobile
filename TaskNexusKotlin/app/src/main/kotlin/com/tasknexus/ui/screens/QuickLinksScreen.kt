package com.tasknexus.ui.screens

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.lifecycle.viewmodel.compose.viewModel
import com.tasknexus.data.entity.QuickLink
import com.tasknexus.ui.theme.*
import com.tasknexus.viewmodel.QuickLinkViewModel

// ─────────────────────────────────────────────────────────────────────────────
// QuickLinksScreen
// ─────────────────────────────────────────────────────────────────────────────

private val ACCENT_COLORS = listOf(
    Color(0xFF4F46E5), Color(0xFF7C3AED), Color(0xFFEC4899),
    Color(0xFFEF4444), Color(0xFFF59E0B), Color(0xFF22C55E),
    Color(0xFF06B6D4), Color(0xFF3B82F6), Color(0xFF64748B),
    Color(0xFF8B5CF6), Color(0xFFE11D48), Color(0xFF0EA5E9)
)

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun QuickLinksScreen(vm: QuickLinkViewModel = viewModel()) {
    val links by vm.uiState.collectAsState()
    val context = LocalContext.current

    var labelInput by remember { mutableStateOf("") }
    var urlInput by remember { mutableStateOf("") }
    var selectedColor by remember { mutableStateOf(ACCENT_COLORS.first()) }
    var showColorPicker by remember { mutableStateOf(false) }
    var linkToDelete by remember { mutableStateOf<QuickLink?>(null) }

    // Color picker dialog
    if (showColorPicker) {
        ColorPickerDialog(
            selectedColor = selectedColor,
            onColorSelected = {
                selectedColor = it
                showColorPicker = false
            },
            onDismiss = { showColorPicker = false }
        )
    }

    // Delete confirmation dialog
    linkToDelete?.let { link ->
        AlertDialog(
            onDismissRequest = { linkToDelete = null },
            title = { Text("Delete link?", color = OnSurface) },
            text = { Text("Remove \"${link.label}\" from quick links?", color = OnSurface2) },
            confirmButton = {
                TextButton(onClick = {
                    vm.deleteLink(link.id)
                    linkToDelete = null
                }) { Text("Delete", color = Danger) }
            },
            dismissButton = {
                TextButton(onClick = { linkToDelete = null }) { Text("Cancel", color = OnSurface2) }
            },
            containerColor = Surface2
        )
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Background)
            .padding(16.dp)
    ) {
        // ── Add link row ─────────────────────────────────────────────────────
        ElevatedCard(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(14.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    "Add Quick Link",
                    style = MaterialTheme.typography.titleSmall.copy(
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                )
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    OutlinedTextField(
                        value = labelInput,
                        onValueChange = { labelInput = it },
                        label = { Text("Label") },
                        singleLine = true,
                        modifier = Modifier.weight(1f),
                        colors = qlTextFieldColors()
                    )
                    OutlinedTextField(
                        value = urlInput,
                        onValueChange = { urlInput = it },
                        label = { Text("URL") },
                        singleLine = true,
                        modifier = Modifier.weight(2f),
                        colors = qlTextFieldColors()
                    )
                }

                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    // Color swatch button
                    Box(
                        modifier = Modifier
                            .size(36.dp)
                            .clip(CircleShape)
                            .background(selectedColor)
                            .border(2.dp, BorderColor, CircleShape)
                            .clickable { showColorPicker = true }
                    )
                    Text(
                        "Color",
                        style = MaterialTheme.typography.labelMedium.copy(color = OnSurface2)
                    )
                    Spacer(Modifier.weight(1f))
                    // Add FAB
                    FloatingActionButton(
                        onClick = {
                            val rawUrl = urlInput.trim()
                            if (labelInput.isNotBlank() && rawUrl.isNotBlank()) {
                                val finalUrl = if (rawUrl.startsWith("http://") || rawUrl.startsWith("https://"))
                                    rawUrl else "https://$rawUrl"
                                vm.addLink(
                                    QuickLink(
                                        id = vm.generateId(),
                                        label = labelInput.trim(),
                                        url = finalUrl,
                                        color = colorToHex(selectedColor),
                                        created = System.currentTimeMillis()
                                    )
                                )
                                labelInput = ""
                                urlInput = ""
                            }
                        },
                        containerColor = Primary,
                        contentColor = Color.White,
                        modifier = Modifier.size(44.dp)
                    ) {
                        Icon(Icons.Default.Add, contentDescription = "Add link")
                    }
                }
            }
        }

        Spacer(Modifier.height(16.dp))

        // ── Grid of link cards ───────────────────────────────────────────────
        if (links.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .weight(1f),
                contentAlignment = Alignment.Center
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(
                        Icons.Default.Link,
                        contentDescription = null,
                        tint = OnSurface3,
                        modifier = Modifier.size(48.dp)
                    )
                    Spacer(Modifier.height(8.dp))
                    Text(
                        "No quick links yet",
                        style = MaterialTheme.typography.bodyMedium.copy(color = OnSurface3)
                    )
                    Text(
                        "Add a link above to get started",
                        style = MaterialTheme.typography.bodySmall.copy(color = OnSurface3)
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                verticalArrangement = Arrangement.spacedBy(10.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                modifier = Modifier.fillMaxSize()
            ) {
                items(links, key = { it.id }) { link ->
                    val accentColor = hexToColor(link.color) ?: Primary
                    LinkCard(
                        link = link,
                        accentColor = accentColor,
                        onClick = {
                            runCatching {
                                val intent = Intent(Intent.ACTION_VIEW, Uri.parse(link.url))
                                context.startActivity(intent)
                            }
                        },
                        onLongPress = { linkToDelete = link },
                        onDelete = { linkToDelete = link }
                    )
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// LinkCard
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun LinkCard(
    link: QuickLink,
    accentColor: Color,
    onClick: () -> Unit,
    onLongPress: () -> Unit,
    onDelete: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .combinedClickable(
                onClick = onClick,
                onLongClick = onLongPress
            ),
        colors = CardDefaults.elevatedCardColors(containerColor = Surface3),
        shape = RoundedCornerShape(14.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                // Color accent dot
                Box(
                    modifier = Modifier
                        .size(12.dp)
                        .clip(CircleShape)
                        .background(accentColor)
                )
                IconButton(
                    onClick = onDelete,
                    modifier = Modifier.size(28.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Delete",
                        tint = OnSurface3,
                        modifier = Modifier.size(16.dp)
                    )
                }
            }

            Spacer(Modifier.height(8.dp))

            // Link icon
            Box(
                modifier = Modifier
                    .size(36.dp)
                    .clip(RoundedCornerShape(8.dp))
                    .background(accentColor.copy(alpha = 0.15f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    Icons.Default.OpenInNew,
                    contentDescription = "Open",
                    tint = accentColor,
                    modifier = Modifier.size(20.dp)
                )
            }

            Spacer(Modifier.height(8.dp))

            Text(
                text = link.label,
                style = MaterialTheme.typography.bodyMedium.copy(
                    fontWeight = FontWeight.SemiBold,
                    color = OnSurface
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )

            Text(
                text = link.url
                    .removePrefix("https://")
                    .removePrefix("http://"),
                style = MaterialTheme.typography.labelSmall.copy(color = OnSurface3),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
                modifier = Modifier.padding(top = 2.dp)
            )
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Color picker dialog
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun ColorPickerDialog(
    selectedColor: Color,
    onColorSelected: (Color) -> Unit,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        ElevatedCard(
            colors = CardDefaults.elevatedCardColors(containerColor = Surface2),
            shape = RoundedCornerShape(20.dp)
        ) {
            Column(modifier = Modifier.padding(20.dp)) {
                Text(
                    "Choose Color",
                    style = MaterialTheme.typography.titleMedium.copy(
                        fontWeight = FontWeight.Bold,
                        color = OnSurface
                    )
                )
                Spacer(Modifier.height(16.dp))
                // 4 columns grid
                val chunked = ACCENT_COLORS.chunked(4)
                chunked.forEach { row ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 6.dp),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        row.forEach { color ->
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(CircleShape)
                                    .background(color)
                                    .border(
                                        width = if (color == selectedColor) 3.dp else 0.dp,
                                        color = Color.White,
                                        shape = CircleShape
                                    )
                                    .clickable { onColorSelected(color) }
                            )
                        }
                        // Fill remaining spaces in last row
                        repeat(4 - row.size) { Spacer(Modifier.size(44.dp)) }
                    }
                }
                Spacer(Modifier.height(8.dp))
                TextButton(
                    onClick = onDismiss,
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Text("Cancel", color = OnSurface2)
                }
            }
        }
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun qlTextFieldColors() = OutlinedTextFieldDefaults.colors(
    focusedBorderColor = Primary,
    unfocusedBorderColor = BorderColor,
    focusedLabelColor = Primary,
    cursorColor = Primary,
    focusedTextColor = OnSurface,
    unfocusedTextColor = OnSurface,
    unfocusedLabelColor = OnSurface2
)

private fun colorToHex(color: Color): String {
    val r = (color.red * 255).toInt()
    val g = (color.green * 255).toInt()
    val b = (color.blue * 255).toInt()
    return "#%02X%02X%02X".format(r, g, b)
}

private fun hexToColor(hex: String): Color? {
    return try {
        val clean = hex.removePrefix("#")
        when (clean.length) {
            6 -> Color(android.graphics.Color.parseColor("#$clean"))
            8 -> Color(android.graphics.Color.parseColor("#$clean"))
            else -> null
        }
    } catch (e: Exception) { null }
}
