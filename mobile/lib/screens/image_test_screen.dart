import 'package:flutter/material.dart';

class ImageTestScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Image Test')),
      body: Padding(
        padding: EdgeInsets.all(20),
        child: Column(
          children: [
            Text('MOMO Code Image:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Image.asset('assets/images/momo-code.png', width: 100, height: 100),
            SizedBox(height: 20),
            Text('Mobile Money Image:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            SizedBox(height: 10),
            Image.asset('assets/images/mobile-money.png', width: 100, height: 100),
            SizedBox(height: 20),
            Text('If you see these images, they are working!', style: TextStyle(fontSize: 16)),
          ],
        ),
      ),
    );
  }
}
