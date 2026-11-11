package io.metamask.nativesdk;

import android.os.Binder;
import android.os.Bundle;
import android.os.IBinder;
import android.os.IInterface;
import android.os.Parcel;
import android.os.RemoteException;

/**
 * Binder interface exposed by {@link MessageService} to native Android dapps (MetaMask Android SDK).
 * The descriptor and transaction codes must stay wire compatible with the AIDL used by the SDK.
 */
public interface IMessegeService extends IInterface {
  void registerCallback(IMessegeServiceCallback callback) throws RemoteException;

  void sendMessage(Bundle message) throws RemoteException;

  abstract class Stub extends Binder implements IMessegeService {
    private static final String DESCRIPTOR = "io.metamask.nativesdk.IMessegeService";
    static final int TRANSACTION_registerCallback = IBinder.FIRST_CALL_TRANSACTION;
    static final int TRANSACTION_sendMessage = IBinder.FIRST_CALL_TRANSACTION + 1;

    public Stub() {
      attachInterface(this, DESCRIPTOR);
    }

    public static IMessegeService asInterface(IBinder obj) {
      if (obj == null) {
        return null;
      }
      IInterface iin = obj.queryLocalInterface(DESCRIPTOR);
      if (iin instanceof IMessegeService) {
        return (IMessegeService) iin;
      }
      return new Proxy(obj);
    }

    @Override
    public IBinder asBinder() {
      return this;
    }

    @Override
    public boolean onTransact(int code, Parcel data, Parcel reply, int flags)
        throws RemoteException {
      switch (code) {
        case INTERFACE_TRANSACTION:
          reply.writeString(DESCRIPTOR);
          return true;
        case TRANSACTION_registerCallback: {
          data.enforceInterface(DESCRIPTOR);
          IMessegeServiceCallback callback =
              IMessegeServiceCallback.Stub.asInterface(data.readStrongBinder());
          registerCallback(callback);
          reply.writeNoException();
          return true;
        }
        case TRANSACTION_sendMessage: {
          data.enforceInterface(DESCRIPTOR);
          Bundle message = data.readInt() != 0 ? Bundle.CREATOR.createFromParcel(data) : null;
          sendMessage(message);
          reply.writeNoException();
          if (message != null) {
            reply.writeInt(1);
            message.writeToParcel(reply, android.os.Parcelable.PARCELABLE_WRITE_RETURN_VALUE);
          } else {
            reply.writeInt(0);
          }
          return true;
        }
        default:
          return super.onTransact(code, data, reply, flags);
      }
    }

    private static class Proxy implements IMessegeService {
      private final IBinder remote;

      Proxy(IBinder remote) {
        this.remote = remote;
      }

      @Override
      public IBinder asBinder() {
        return remote;
      }

      @Override
      public void registerCallback(IMessegeServiceCallback callback) throws RemoteException {
        Parcel data = Parcel.obtain();
        Parcel reply = Parcel.obtain();
        try {
          data.writeInterfaceToken(DESCRIPTOR);
          data.writeStrongBinder(callback != null ? callback.asBinder() : null);
          remote.transact(TRANSACTION_registerCallback, data, reply, 0);
          reply.readException();
        } finally {
          reply.recycle();
          data.recycle();
        }
      }

      @Override
      public void sendMessage(Bundle message) throws RemoteException {
        Parcel data = Parcel.obtain();
        Parcel reply = Parcel.obtain();
        try {
          data.writeInterfaceToken(DESCRIPTOR);
          if (message != null) {
            data.writeInt(1);
            message.writeToParcel(data, 0);
          } else {
            data.writeInt(0);
          }
          remote.transact(TRANSACTION_sendMessage, data, reply, 0);
          reply.readException();
          if (reply.readInt() != 0 && message != null) {
            message.readFromParcel(reply);
          }
        } finally {
          reply.recycle();
          data.recycle();
        }
      }
    }
  }
}
