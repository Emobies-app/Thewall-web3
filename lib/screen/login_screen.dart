import 'dart:math' as math;
import 'package:flutter/material.dart';

class TheWallUltimateLogo extends StatefulWidget {
  final double size;
  const TheWallUltimateLogo({super.key, this.size = 250});

  @override
  State<TheWallUltimateLogo> createState() => _TheWallUltimateLogoState();
}

class _TheWallUltimateLogoState extends State<TheWallUltimateLogo>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _scanController;
  late AnimationController _rotateController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2000),
    )..repeat(reverse: true);

    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();

    _rotateController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 20),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scanController.dispose();
    _rotateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: Listenable.merge([_pulseController, _scanController, _rotateController]),
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: UltimateLogoPainter(
            pulse:  _pulseController.value,
            scan:   _scanController.value,
            rotate: _rotateController.value,
          ),
        );
      },
    );
  }
}

class UltimateLogoPainter extends CustomPainter {
  final double pulse;
  final double scan;
  final double rotate;

  UltimateLogoPainter({
    required this.pulse,
    required this.scan,
    required this.rotate,
  });

  // Hexagon path helper
  Path _hexPath(Offset center, double radius, {double rotation = 0}) {
    final path = Path();
    for (int i = 0; i < 6; i++) {
      final angle = (i * 60 + rotation) * math.pi / 180;
      final x = center.dx + radius * math.cos(angle);
      final y = center.dy + radius * math.sin(angle);
      if (i == 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    }
    path.close();
    return path;
  }

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / 2.1;

    // â”€â”€ 1. OUTER GLOW RING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final glowRadius = radius + 8 + (pulse * 6);
    canvas.drawCircle(
      center,
      glowRadius,
      Paint()
        ..color = const Color(0xFF00E5FF).withOpacity(0.06 + pulse * 0.06)
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 20 + pulse * 10),
    );

    // â”€â”€ 2. OUTER ROTATING HEX â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final outerHex = _hexPath(center, radius, rotation: rotate * 360);
    canvas.drawPath(
      outerHex,
      Paint()
        ..shader = LinearGradient(
          colors: [
            const Color(0xFF627EEA).withOpacity(0.3),
            const Color(0xFF00E5FF).withOpacity(0.15),
            const Color(0xFF9945FF).withOpacity(0.3),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5,
    );

    // â”€â”€ 3. MAIN HEX BACKGROUND â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final mainHex = _hexPath(center, radius * 0.9);

    // Dark background
    canvas.drawPath(
      mainHex,
      Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0xFF0D1F3C),
            const Color(0xFF050A14),
          ],
          center: const Alignment(-0.3, -0.3),
        ).createShader(Rect.fromCircle(center: center, radius: radius)),
    );

    // Hex border glow
    canvas.drawPath(
      mainHex,
      Paint()
        ..shader = LinearGradient(
          colors: [
            const Color(0xFF627EEA),
            const Color(0xFF00E5FF),
            const Color(0xFF9945FF),
            const Color(0xFF627EEA),
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
        ..style = PaintingStyle.stroke
        ..strokeWidth = 2.5
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 4),
    );

    // â”€â”€ 4. BRICK WALL PATTERN â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    canvas.save();
    canvas.clipPath(mainHex);

    final brickPaint = Paint()
      ..color = const Color(0xFF00E5FF).withOpacity(0.08)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 0.8;

    final brickH = size.height / 7;
    final brickW = size.width / 3;

    for (int row = 0; row < 8; row++) {
      final y = row * brickH;
      // Horizontal line
      canvas.drawLine(Offset(0, y), Offset(size.width, y), brickPaint);
      // Vertical brick dividers (offset per row)
      final offsetX = (row % 2 == 0) ? 0.0 : brickW / 2;
      for (double x = offsetX; x < size.width; x += brickW) {
        canvas.drawLine(Offset(x, y), Offset(x, y + brickH), brickPaint);
      }
    }

    // â”€â”€ 5. SCAN LINE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final scanY = size.height * 0.15 + (size.height * 0.7 * scan);
    // Main scan line
    canvas.drawLine(
      Offset(0, scanY),
      Offset(size.width, scanY),
      Paint()
        ..color = const Color(0xFF00FF88).withOpacity(0.5)
        ..strokeWidth = 1.5
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 3),
    );
    // Scan glow trail
    canvas.drawLine(
      Offset(0, scanY - 8),
      Offset(size.width, scanY - 8),
      Paint()
        ..color = const Color(0xFF00FF88).withOpacity(0.1)
        ..strokeWidth = 8
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 6),
    );

    canvas.restore();

    // â”€â”€ 6. INNER HEX RING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final innerHex = _hexPath(center, radius * 0.55);
    canvas.drawPath(
      innerHex,
      Paint()
        ..color = const Color(0xFF00E5FF).withOpacity(0.15 + pulse * 0.1)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1,
    );

    // â”€â”€ 7. CENTER CHAIN DOTS â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final dotColors = [
      const Color(0xFF627EEA), // ETH blue
      const Color(0xFF9945FF), // SOL purple
      const Color(0xFF836EF9), // MON
      const Color(0xFF12AAFF), // ARB
      const Color(0xFFF7931A), // BTC orange
    ];

    for (int i = 0; i < 5; i++) {
      final angle = (i * 72 - 90) * math.pi / 180;
      final dotX = center.dx + radius * 0.68 * math.cos(angle);
      final dotY = center.dy + radius * 0.68 * math.sin(angle);
      canvas.drawCircle(
        Offset(dotX, dotY),
        3.5 + (pulse * 1.5),
        Paint()
          ..color = dotColors[i].withOpacity(0.8 + pulse * 0.2)
          ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 3),
      );
    }

    // â”€â”€ 8. CENTER W â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final textPainter = TextPainter(
      text: TextSpan(
        text: 'W',
        style: TextStyle(
          fontSize: size.width * 0.28,
          fontWeight: FontWeight.w900,
          color: Colors.white,
          fontFamily: 'monospace',
          shadows: [
            Shadow(
              blurRadius: 12 + (pulse * 16),
              color: const Color(0xFF00FF88),
              offset: Offset.zero,
            ),
            Shadow(
              blurRadius: 6,
              color: const Color(0xFF00E5FF).withOpacity(0.6),
              offset: Offset.zero,
            ),
          ],
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    textPainter.layout();
    textPainter.paint(
      canvas,
      center - Offset(textPainter.width / 2, textPainter.height / 2),
    );

    // â”€â”€ 9. CORNER HEX SPARKLES â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    for (int i = 0; i < 6; i++) {
      final angle = (i * 60) * math.pi / 180;
      final sx = center.dx + radius * 0.9 * math.cos(angle);
      final sy = center.dy + radius * 0.9 * math.sin(angle);
      canvas.drawCircle(
        Offset(sx, sy),
        2 + pulse,
        Paint()
          ..color = const Color(0xFF00E5FF).withOpacity(0.6 + pulse * 0.4)
          ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 2),
      );
    }
  }

  @override
  bool shouldRepaint(covariant UltimateLogoPainter old) =>
      old.pulse != pulse || old.scan != scan || old.rotate != rotate;
}
