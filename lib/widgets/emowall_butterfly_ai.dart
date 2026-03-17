import 'dart:math' as math;
import 'package:flutter/material.dart';

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EMOWALL AI BUTTERFLY â€” Animated AI Assistant Widget
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

enum ButterflyState {
  idle,       // Gentle float
  thinking,   // Wings flutter fast + purple
  answering,  // Wings spread + green glow
  loading,    // Spinning + blue
  happy,      // Gold sparkles
}

class EmowallButterflyAI extends StatefulWidget {
  final double size;
  final ButterflyState state;
  final VoidCallback? onTap;

  const EmowallButterflyAI({
    super.key,
    this.size = 120,
    this.state = ButterflyState.idle,
    this.onTap,
  });

  @override
  State<EmowallButterflyAI> createState() => _EmowallButterflyAIState();
}

class _EmowallButterflyAIState extends State<EmowallButterflyAI>
    with TickerProviderStateMixin {

  // Wing flap controller
  late AnimationController _wingController;
  // Float up/down
  late AnimationController _floatController;
  // Color shift
  late AnimationController _colorController;
  // Particle/sparkle
  late AnimationController _sparkleController;
  // Body pulse
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();

    _wingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    )..repeat(reverse: true);

    _floatController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);

    _colorController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 3000),
    )..repeat();

    _sparkleController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat(reverse: true);

    _updateStateAnimations();
  }

  @override
  void didUpdateWidget(EmowallButterflyAI oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.state != widget.state) {
      _updateStateAnimations();
    }
  }

  void _updateStateAnimations() {
    switch (widget.state) {
      case ButterflyState.idle:
        _wingController.duration = const Duration(milliseconds: 1200);
        _wingController.repeat(reverse: true);
        break;
      case ButterflyState.thinking:
        _wingController.duration = const Duration(milliseconds: 250);
        _wingController.repeat(reverse: true);
        break;
      case ButterflyState.answering:
        _wingController.duration = const Duration(milliseconds: 400);
        _wingController.repeat(reverse: true);
        break;
      case ButterflyState.loading:
        _wingController.duration = const Duration(milliseconds: 300);
        _wingController.repeat(reverse: true);
        break;
      case ButterflyState.happy:
        _wingController.duration = const Duration(milliseconds: 200);
        _wingController.repeat(reverse: true);
        break;
    }
  }

  @override
  void dispose() {
    _wingController.dispose();
    _floatController.dispose();
    _colorController.dispose();
    _sparkleController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  // State colors
  List<Color> get _stateColors {
    switch (widget.state) {
      case ButterflyState.idle:
        return [const Color(0xFF9945FF), const Color(0xFF00E5FF), const Color(0xFF627EEA)];
      case ButterflyState.thinking:
        return [const Color(0xFF836EF9), const Color(0xFF9945FF), const Color(0xFF5E2B97)];
      case ButterflyState.answering:
        return [const Color(0xFF00FF88), const Color(0xFF00E5FF), const Color(0xFF00CC44)];
      case ButterflyState.loading:
        return [const Color(0xFF627EEA), const Color(0xFF00E5FF), const Color(0xFF1A4FC4)];
      case ButterflyState.happy:
        return [const Color(0xFFFFD700), const Color(0xFFF7931A), const Color(0xFFFFAA00)];
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: Listenable.merge([
          _wingController,
          _floatController,
          _colorController,
          _sparkleController,
          _pulseController,
        ]),
        builder: (context, child) {
          final floatOffset = math.sin(_floatController.value * math.pi) * 8;

          return Transform.translate(
            offset: Offset(0, -floatOffset),
            child: CustomPaint(
              size: Size(widget.size, widget.size),
              painter: ButterflyPainter(
                wingOpen:    _wingController.value,
                colorShift:  _colorController.value,
                sparkle:     _sparkleController.value,
                pulse:       _pulseController.value,
                stateColors: _stateColors,
                state:       widget.state,
              ),
            ),
          );
        },
      ),
    );
  }
}

// â”€â”€ Painter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
class ButterflyPainter extends CustomPainter {
  final double wingOpen;
  final double colorShift;
  final double sparkle;
  final double pulse;
  final List<Color> stateColors;
  final ButterflyState state;

  ButterflyPainter({
    required this.wingOpen,
    required this.colorShift,
    required this.sparkle,
    required this.pulse,
    required this.stateColors,
    required this.state,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final w  = size.width;
    final h  = size.height;

    // Current colors based on state
    final c1 = stateColors[0];
    final c2 = stateColors[1];
    final c3 = stateColors[2];

    // Wing spread factor (0 = closed, 1 = fully open)
    final spread = 0.4 + (wingOpen * 0.6);

    // â”€â”€ OUTER GLOW â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    canvas.drawCircle(
      Offset(cx, cy),
      w * 0.5,
      Paint()
        ..color = c2.withOpacity(0.05 + pulse * 0.08)
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 20 + pulse * 15),
    );

    // â”€â”€ LEFT UPPER WING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final leftUpperWing = Path();
    leftUpperWing.moveTo(cx, cy - h * 0.05);
    leftUpperWing.cubicTo(
      cx - w * 0.15,           cy - h * 0.45,
      cx - w * spread * 0.85,  cy - h * 0.35,
      cx - w * spread * 0.7,   cy - h * 0.05,
    );
    leftUpperWing.cubicTo(
      cx - w * spread * 0.5,   cy + h * 0.05,
      cx - w * 0.1,             cy + h * 0.05,
      cx,                       cy - h * 0.05,
    );
    leftUpperWing.close();

    canvas.drawPath(
      leftUpperWing,
      Paint()
        ..shader = RadialGradient(
          colors: [
            c1.withOpacity(0.9),
            c2.withOpacity(0.7),
            c3.withOpacity(0.4),
          ],
          center: const Alignment(-0.5, -0.3),
        ).createShader(Rect.fromLTWH(0, 0, w, h))
        ..maskFilter = MaskFilter.blur(BlurStyle.inner, 2),
    );

    // Wing border glow
    canvas.drawPath(
      leftUpperWing,
      Paint()
        ..color = c2.withOpacity(0.6 + pulse * 0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 3 + pulse * 4),
    );

    // â”€â”€ RIGHT UPPER WING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final rightUpperWing = Path();
    rightUpperWing.moveTo(cx, cy - h * 0.05);
    rightUpperWing.cubicTo(
      cx + w * 0.15,            cy - h * 0.45,
      cx + w * spread * 0.85,   cy - h * 0.35,
      cx + w * spread * 0.7,    cy - h * 0.05,
    );
    rightUpperWing.cubicTo(
      cx + w * spread * 0.5,    cy + h * 0.05,
      cx + w * 0.1,              cy + h * 0.05,
      cx,                        cy - h * 0.05,
    );
    rightUpperWing.close();

    canvas.drawPath(
      rightUpperWing,
      Paint()
        ..shader = RadialGradient(
          colors: [
            c1.withOpacity(0.9),
            c2.withOpacity(0.7),
            c3.withOpacity(0.4),
          ],
          center: const Alignment(0.5, -0.3),
        ).createShader(Rect.fromLTWH(0, 0, w, h))
        ..maskFilter = MaskFilter.blur(BlurStyle.inner, 2),
    );
    canvas.drawPath(
      rightUpperWing,
      Paint()
        ..color = c2.withOpacity(0.6 + pulse * 0.4)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.5
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 3 + pulse * 4),
    );

    // â”€â”€ LEFT LOWER WING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final leftLowerWing = Path();
    leftLowerWing.moveTo(cx, cy + h * 0.05);
    leftLowerWing.cubicTo(
      cx - w * 0.1,             cy + h * 0.05,
      cx - w * spread * 0.7,    cy + h * 0.05,
      cx - w * spread * 0.5,    cy + h * 0.35,
    );
    leftLowerWing.cubicTo(
      cx - w * 0.25,            cy + h * 0.42,
      cx - w * 0.05,            cy + h * 0.3,
      cx,                        cy + h * 0.05,
    );
    leftLowerWing.close();

    canvas.drawPath(
      leftLowerWing,
      Paint()
        ..shader = RadialGradient(
          colors: [
            c2.withOpacity(0.8),
            c3.withOpacity(0.5),
          ],
          center: const Alignment(-0.3, 0.5),
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );
    canvas.drawPath(
      leftLowerWing,
      Paint()
        ..color = c1.withOpacity(0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 3),
    );

    // â”€â”€ RIGHT LOWER WING â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final rightLowerWing = Path();
    rightLowerWing.moveTo(cx, cy + h * 0.05);
    rightLowerWing.cubicTo(
      cx + w * 0.1,              cy + h * 0.05,
      cx + w * spread * 0.7,     cy + h * 0.05,
      cx + w * spread * 0.5,     cy + h * 0.35,
    );
    rightLowerWing.cubicTo(
      cx + w * 0.25,             cy + h * 0.42,
      cx + w * 0.05,             cy + h * 0.3,
      cx,                         cy + h * 0.05,
    );
    rightLowerWing.close();

    canvas.drawPath(
      rightLowerWing,
      Paint()
        ..shader = RadialGradient(
          colors: [
            c2.withOpacity(0.8),
            c3.withOpacity(0.5),
          ],
          center: const Alignment(0.3, 0.5),
        ).createShader(Rect.fromLTWH(0, 0, w, h)),
    );
    canvas.drawPath(
      rightLowerWing,
      Paint()
        ..color = c1.withOpacity(0.5)
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 3),
    );

    // â”€â”€ WING PATTERNS (inner circles) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Left upper circle
    canvas.drawCircle(
      Offset(cx - w * 0.28, cy - h * 0.18),
      w * 0.07,
      Paint()
        ..color = c2.withOpacity(0.4 + pulse * 0.3)
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 4 + pulse * 3),
    );
    // Right upper circle
    canvas.drawCircle(
      Offset(cx + w * 0.28, cy - h * 0.18),
      w * 0.07,
      Paint()
        ..color = c2.withOpacity(0.4 + pulse * 0.3)
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 4 + pulse * 3),
    );

    // â”€â”€ BODY â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final bodyPath = Path();
    bodyPath.moveTo(cx, cy - h * 0.25);
    bodyPath.cubicTo(
      cx - w * 0.04, cy - h * 0.1,
      cx - w * 0.04, cy + h * 0.1,
      cx,             cy + h * 0.28,
    );
    bodyPath.cubicTo(
      cx + w * 0.04, cy + h * 0.1,
      cx + w * 0.04, cy - h * 0.1,
      cx,             cy - h * 0.25,
    );
    bodyPath.close();

    canvas.drawPath(
      bodyPath,
      Paint()
        ..shader = LinearGradient(
          colors: [c1, c2],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ).createShader(Rect.fromLTWH(cx - 10, cy - h * 0.25, 20, h * 0.53))
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 2 + pulse * 3),
    );

    // â”€â”€ HEAD â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    canvas.drawCircle(
      Offset(cx, cy - h * 0.27),
      w * 0.055,
      Paint()
        ..color = c2
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 4 + pulse * 5),
    );

    // Eyes
    canvas.drawCircle(
      Offset(cx - w * 0.02, cy - h * 0.28),
      w * 0.015,
      Paint()..color = Colors.white.withOpacity(0.9),
    );
    canvas.drawCircle(
      Offset(cx + w * 0.02, cy - h * 0.28),
      w * 0.015,
      Paint()..color = Colors.white.withOpacity(0.9),
    );

    // â”€â”€ ANTENNAE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    final antennaPaint = Paint()
      ..color = c2.withOpacity(0.8)
      ..strokeWidth = 1.2
      ..style = PaintingStyle.stroke;

    // Left antenna
    canvas.drawLine(
      Offset(cx - w * 0.01, cy - h * 0.3),
      Offset(cx - w * 0.12, cy - h * 0.47),
      antennaPaint,
    );
    canvas.drawCircle(
      Offset(cx - w * 0.12, cy - h * 0.47),
      w * 0.02,
      Paint()
        ..color = c1
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 3 + pulse * 3),
    );

    // Right antenna
    canvas.drawLine(
      Offset(cx + w * 0.01, cy - h * 0.3),
      Offset(cx + w * 0.12, cy - h * 0.47),
      antennaPaint,
    );
    canvas.drawCircle(
      Offset(cx + w * 0.12, cy - h * 0.47),
      w * 0.02,
      Paint()
        ..color = c1
        ..maskFilter = MaskFilter.blur(BlurStyle.outer, 3 + pulse * 3),
    );

    // â”€â”€ SPARKLES (thinking/happy state) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (state == ButterflyState.thinking ||
        state == ButterflyState.happy ||
        state == ButterflyState.answering) {
      final rand = math.Random(42);
      for (int i = 0; i < 6; i++) {
        final angle = (i * 60 + sparkle * 360) * math.pi / 180;
        final dist  = w * (0.42 + math.sin(sparkle * math.pi * 2 + i) * 0.08);
        final sx    = cx + dist * math.cos(angle);
        final sy    = cy + dist * math.sin(angle);
        final sSize = w * (0.012 + rand.nextDouble() * 0.015);

        canvas.drawCircle(
          Offset(sx, sy),
          sSize * (0.5 + math.sin(sparkle * math.pi * 4 + i) * 0.5),
          Paint()
            ..color = c2.withOpacity(0.7)
            ..maskFilter = MaskFilter.blur(BlurStyle.outer, 3),
        );
      }
    }

    // â”€â”€ STATE LABEL â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    String label = '';
    switch (state) {
      case ButterflyState.idle:
        label = 'Emowall AI';
        break;
      case ButterflyState.thinking:
        label = 'Thinking...';
        break;
      case ButterflyState.answering:
        label = 'Answering âœ“';
        break;
      case ButterflyState.loading:
        label = 'Loading...';
        break;
      case ButterflyState.happy:
        label = 'Done! ðŸ¦‹';
        break;
    }

    final textPainter = TextPainter(
      text: TextSpan(
        text: label,
        style: TextStyle(
          fontSize: w * 0.1,
          fontFamily: 'monospace',
          color: c2.withOpacity(0.8),
          shadows: [
            Shadow(
              blurRadius: 6,
              color: c2.withOpacity(0.5),
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
      Offset(
        cx - textPainter.width / 2,
        cy + h * 0.38,
      ),
    );
  }

  @override
  bool shouldRepaint(covariant ButterflyPainter old) => true;
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EMOWALL AI CHAT WIDGET â€” Full chat with butterfly
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

class EmowallAIChatWidget extends StatefulWidget {
  const EmowallAIChatWidget({super.key});

  @override
  State<EmowallAIChatWidget> createState() => _EmowallAIChatWidgetState();
}

class _EmowallAIChatWidgetState extends State<EmowallAIChatWidget> {
  bool _isOpen = false;
  ButterflyState _butterflyState = ButterflyState.idle;
  final List<Map<String, String>> _messages = [];
  final TextEditingController _inputController = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  void _toggleChat() {
    setState(() {
      _isOpen = !_isOpen;
      _butterflyState = _isOpen
          ? ButterflyState.happy
          : ButterflyState.idle;
    });
    if (_isOpen) {
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) {
          setState(() => _butterflyState = ButterflyState.idle);
        }
      });
    }
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _butterflyState = ButterflyState.thinking;
      _inputController.clear();
    });

    _scrollToBottom();

    // Simulate AI response (replace with real API call)
    await Future.delayed(const Duration(milliseconds: 1500));

    setState(() {
      _butterflyState = ButterflyState.answering;
      _messages.add({
        'role': 'ai',
        'content': _getAIResponse(text),
      });
    });

    _scrollToBottom();

    await Future.delayed(const Duration(milliseconds: 800));
    if (mounted) {
      setState(() => _butterflyState = ButterflyState.idle);
    }
  }

  String _getAIResponse(String input) {
    final q = input.toLowerCase();
    if (q.contains('swap')) {
      return 'To swap: Trade tab â†’ Connect Wallet â†’ Enter amount â†’ Select tokens â†’ Swap! âš¡ Gas is FREE!';
    } else if (q.contains('wallet') || q.contains('connect')) {
      return 'Click "Connect Wallet" in Trade tab. 530+ wallets supported including MetaMask, Phantom & Google! ðŸ”—';
    } else if (q.contains('chain') || q.contains('network')) {
      return 'TheWall supports 5 chains: ðŸŒEarth(ETH) ðŸŒŸSoul(SOL) ðŸŒ™Moon(MON) ðŸªOrbit(ARB) â‚¿Birth(BTC)';
    } else if (q.contains('gas') || q.contains('fee')) {
      return 'All transactions on TheWall are GASLESS! âš¡ Powered by Alchemy Gas Manager.';
    } else if (q.contains('emocoin') || q.contains('emc')) {
      return 'EmoCoins (EMC) = TheWall native token. 1 EMC = \$0.01. Claim daily! ðŸª™';
    } else {
      return 'Hi! I\'m Emowall AI Web3 ðŸ¦‹ I can help with swaps, wallets, chains & more. What do you need?';
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _inputController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      alignment: Alignment.bottomRight,
      children: [
        // Chat panel
        if (_isOpen)
          Positioned(
            bottom: 140,
            right: 0,
            child: Container(
              width: 300,
              height: 400,
              decoration: BoxDecoration(
                color: const Color(0xFF050A14),
                border: Border.all(
                  color: const Color(0xFF627EEA).withOpacity(0.3),
                ),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF00E5FF).withOpacity(0.1),
                    blurRadius: 20,
                    spreadRadius: 2,
                  ),
                ],
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: const BoxDecoration(
                      border: Border(
                        bottom: BorderSide(
                          color: Color(0xFF627EEA),
                          width: 0.5,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        RepaintBoundary(
                          child: EmowallButterflyAI(
                            size: 36,
                            state: _butterflyState,
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Emowall AI Web3',
                              style: TextStyle(
                                color: Color(0xFF00E5FF),
                                fontFamily: 'monospace',
                                fontSize: 12,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                            Text(
                              'ðŸ¦‹ Always here to help',
                              style: TextStyle(
                                color: Color(0xFF627EEA),
                                fontFamily: 'monospace',
                                fontSize: 9,
                              ),
                            ),
                          ],
                        ),
                        const Spacer(),
                        GestureDetector(
                          onTap: _toggleChat,
                          child: const Icon(
                            Icons.close,
                            color: Color(0xFF627EEA),
                            size: 18,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Messages
                  Expanded(
                    child: _messages.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                RepaintBoundary(
                                  child: EmowallButterflyAI(
                                    size: 80,
                                    state: ButterflyState.idle,
                                  ),
                                ),
                                const SizedBox(height: 12),
                                const Text(
                                  'Hi! I\'m Emowall AI Web3 ðŸ¦‹\nAsk me anything!',
                                  textAlign: TextAlign.center,
                                  style: TextStyle(
                                    color: Color(0xFF627EEA),
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                  ),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            controller: _scrollController,
                            padding: const EdgeInsets.all(12),
                            itemCount: _messages.length,
                            itemBuilder: (context, i) {
                              final msg = _messages[i];
                              final isUser = msg['role'] == 'user';
                              return Align(
                                alignment: isUser
                                    ? Alignment.centerRight
                                    : Alignment.centerLeft,
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 8,
                                  ),
                                  constraints: const BoxConstraints(maxWidth: 220),
                                  decoration: BoxDecoration(
                                    color: isUser
                                        ? const Color(0xFF0D1F3C)
                                        : const Color(0xFF050F1A),
                                    border: Border.all(
                                      color: isUser
                                          ? const Color(0xFF627EEA)
                                              .withOpacity(0.4)
                                          : const Color(0xFF00E5FF)
                                              .withOpacity(0.3),
                                    ),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Text(
                                    msg['content']!,
                                    style: TextStyle(
                                      color: isUser
                                          ? const Color(0xFFE8F4FD)
                                          : const Color(0xFF00E5FF),
                                      fontFamily: 'monospace',
                                      fontSize: 11,
                                    ),
                                  ),
                                ),
                              );
                            },
                          ),
                  ),

                  // Input
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: const BoxDecoration(
                      border: Border(
                        top: BorderSide(
                          color: Color(0xFF627EEA),
                          width: 0.5,
                        ),
                      ),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _inputController,
                            style: const TextStyle(
                              color: Color(0xFFE8F4FD),
                              fontFamily: 'monospace',
                              fontSize: 12,
                            ),
                            decoration: InputDecoration(
                              hintText: 'Ask Emowall AI...',
                              hintStyle: TextStyle(
                                color: const Color(0xFF627EEA).withOpacity(0.4),
                                fontFamily: 'monospace',
                                fontSize: 11,
                              ),
                              border: InputBorder.none,
                              isDense: true,
                            ),
                            onSubmitted: _sendMessage,
                          ),
                        ),
                        GestureDetector(
                          onTap: () => _sendMessage(_inputController.text),
                          child: Container(
                            padding: const EdgeInsets.all(6),
                            decoration: BoxDecoration(
                              color: const Color(0xFF627EEA).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(6),
                              border: Border.all(
                                color: const Color(0xFF627EEA).withOpacity(0.4),
                              ),
                            ),
                            child: const Icon(
                              Icons.send,
                              color: Color(0xFF00E5FF),
                              size: 16,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

        // Butterfly FAB button
        GestureDetector(
          onTap: _toggleChat,
          child: RepaintBoundary(
            child: EmowallButterflyAI(
              size: 90,
              state: _butterflyState,
              onTap: _toggleChat,
            ),
          ),
        ),
      ],
    );
  }
}
