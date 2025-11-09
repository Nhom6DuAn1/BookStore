package quynh.ph59304.bansach;

import android.content.Intent;
import android.os.Bundle;

import androidx.appcompat.app.AppCompatActivity;

import quynh.ph59304.bansach.utils.SharedPreferencesManager;

public class MainActivity extends AppCompatActivity {

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        SharedPreferencesManager prefManager = new SharedPreferencesManager(this);
        
        // Kiểm tra đăng nhập và chuyển hướng
        if (prefManager.isLoggedIn()) {
            startActivity(new Intent(this, BookListActivity.class));
        } else {
            startActivity(new Intent(this, LoginActivity.class));
        }
        finish();
    }
}