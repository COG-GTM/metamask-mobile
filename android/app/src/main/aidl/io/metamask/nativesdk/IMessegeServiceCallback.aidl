package io.metamask.nativesdk;

import android.os.Bundle;

interface IMessegeServiceCallback {
    void onMessageReceived(in Bundle response);
}
