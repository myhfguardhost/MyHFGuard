package com.vitalink.connect;

import android.database.Cursor;
import android.os.CancellationSignal;
import androidx.annotation.NonNull;
import androidx.room.CoroutinesRoom;
import androidx.room.EntityInsertionAdapter;
import androidx.room.RoomDatabase;
import androidx.room.RoomSQLiteQuery;
import androidx.room.util.CursorUtil;
import androidx.room.util.DBUtil;
import androidx.room.util.StringUtil;
import androidx.sqlite.db.SupportSQLiteStatement;
import java.lang.Class;
import java.lang.Exception;
import java.lang.Object;
import java.lang.Override;
import java.lang.String;
import java.lang.StringBuilder;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.Callable;
import javax.annotation.processing.Generated;
import kotlin.Unit;
import kotlin.coroutines.Continuation;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class PendingDao_Impl implements PendingDao {
  private final RoomDatabase __db;

  private final EntityInsertionAdapter<PendingSteps> __insertionAdapterOfPendingSteps;

  private final EntityInsertionAdapter<PendingHr> __insertionAdapterOfPendingHr;

  private final EntityInsertionAdapter<PendingSpo2> __insertionAdapterOfPendingSpo2;

  private final EntityInsertionAdapter<PendingDistance> __insertionAdapterOfPendingDistance;

  public PendingDao_Impl(@NonNull final RoomDatabase __db) {
    this.__db = __db;
    this.__insertionAdapterOfPendingSteps = new EntityInsertionAdapter<PendingSteps>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `pending_steps` (`recordUid`,`patientId`,`originId`,`deviceId`,`startTs`,`endTs`,`count`,`tzOffsetMin`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PendingSteps entity) {
        statement.bindString(1, entity.getRecordUid());
        statement.bindString(2, entity.getPatientId());
        statement.bindString(3, entity.getOriginId());
        statement.bindString(4, entity.getDeviceId());
        statement.bindString(5, entity.getStartTs());
        statement.bindString(6, entity.getEndTs());
        statement.bindLong(7, entity.getCount());
        statement.bindLong(8, entity.getTzOffsetMin());
      }
    };
    this.__insertionAdapterOfPendingHr = new EntityInsertionAdapter<PendingHr>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `pending_hr` (`recordUid`,`patientId`,`originId`,`deviceId`,`timeTs`,`bpm`,`tzOffsetMin`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PendingHr entity) {
        statement.bindString(1, entity.getRecordUid());
        statement.bindString(2, entity.getPatientId());
        statement.bindString(3, entity.getOriginId());
        statement.bindString(4, entity.getDeviceId());
        statement.bindString(5, entity.getTimeTs());
        statement.bindLong(6, entity.getBpm());
        statement.bindLong(7, entity.getTzOffsetMin());
      }
    };
    this.__insertionAdapterOfPendingSpo2 = new EntityInsertionAdapter<PendingSpo2>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `pending_spo2` (`recordUid`,`patientId`,`originId`,`deviceId`,`timeTs`,`spo2Pct`,`tzOffsetMin`) VALUES (?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PendingSpo2 entity) {
        statement.bindString(1, entity.getRecordUid());
        statement.bindString(2, entity.getPatientId());
        statement.bindString(3, entity.getOriginId());
        statement.bindString(4, entity.getDeviceId());
        statement.bindString(5, entity.getTimeTs());
        statement.bindDouble(6, entity.getSpo2Pct());
        statement.bindLong(7, entity.getTzOffsetMin());
      }
    };
    this.__insertionAdapterOfPendingDistance = new EntityInsertionAdapter<PendingDistance>(__db) {
      @Override
      @NonNull
      protected String createQuery() {
        return "INSERT OR ABORT INTO `pending_distance` (`recordUid`,`patientId`,`originId`,`deviceId`,`startTs`,`endTs`,`meters`,`tzOffsetMin`) VALUES (?,?,?,?,?,?,?,?)";
      }

      @Override
      protected void bind(@NonNull final SupportSQLiteStatement statement,
          @NonNull final PendingDistance entity) {
        statement.bindString(1, entity.getRecordUid());
        statement.bindString(2, entity.getPatientId());
        statement.bindString(3, entity.getOriginId());
        statement.bindString(4, entity.getDeviceId());
        statement.bindString(5, entity.getStartTs());
        statement.bindString(6, entity.getEndTs());
        statement.bindLong(7, entity.getMeters());
        statement.bindLong(8, entity.getTzOffsetMin());
      }
    };
  }

  @Override
  public Object insertSteps(final PendingSteps item, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPendingSteps.insert(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertHr(final PendingHr item, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPendingHr.insert(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertSpo2(final PendingSpo2 item, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPendingSpo2.insert(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object insertDistance(final PendingDistance item,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        __db.beginTransaction();
        try {
          __insertionAdapterOfPendingDistance.insert(item);
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object getSteps(final int limit,
      final Continuation<? super List<PendingSteps>> $completion) {
    final String _sql = "SELECT * FROM pending_steps LIMIT ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, limit);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PendingSteps>>() {
      @Override
      @NonNull
      public List<PendingSteps> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRecordUid = CursorUtil.getColumnIndexOrThrow(_cursor, "recordUid");
          final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patientId");
          final int _cursorIndexOfOriginId = CursorUtil.getColumnIndexOrThrow(_cursor, "originId");
          final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
          final int _cursorIndexOfStartTs = CursorUtil.getColumnIndexOrThrow(_cursor, "startTs");
          final int _cursorIndexOfEndTs = CursorUtil.getColumnIndexOrThrow(_cursor, "endTs");
          final int _cursorIndexOfCount = CursorUtil.getColumnIndexOrThrow(_cursor, "count");
          final int _cursorIndexOfTzOffsetMin = CursorUtil.getColumnIndexOrThrow(_cursor, "tzOffsetMin");
          final List<PendingSteps> _result = new ArrayList<PendingSteps>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PendingSteps _item;
            final String _tmpRecordUid;
            _tmpRecordUid = _cursor.getString(_cursorIndexOfRecordUid);
            final String _tmpPatientId;
            _tmpPatientId = _cursor.getString(_cursorIndexOfPatientId);
            final String _tmpOriginId;
            _tmpOriginId = _cursor.getString(_cursorIndexOfOriginId);
            final String _tmpDeviceId;
            _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
            final String _tmpStartTs;
            _tmpStartTs = _cursor.getString(_cursorIndexOfStartTs);
            final String _tmpEndTs;
            _tmpEndTs = _cursor.getString(_cursorIndexOfEndTs);
            final long _tmpCount;
            _tmpCount = _cursor.getLong(_cursorIndexOfCount);
            final int _tmpTzOffsetMin;
            _tmpTzOffsetMin = _cursor.getInt(_cursorIndexOfTzOffsetMin);
            _item = new PendingSteps(_tmpRecordUid,_tmpPatientId,_tmpOriginId,_tmpDeviceId,_tmpStartTs,_tmpEndTs,_tmpCount,_tmpTzOffsetMin);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getHr(final int limit, final Continuation<? super List<PendingHr>> $completion) {
    final String _sql = "SELECT * FROM pending_hr LIMIT ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, limit);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PendingHr>>() {
      @Override
      @NonNull
      public List<PendingHr> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRecordUid = CursorUtil.getColumnIndexOrThrow(_cursor, "recordUid");
          final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patientId");
          final int _cursorIndexOfOriginId = CursorUtil.getColumnIndexOrThrow(_cursor, "originId");
          final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
          final int _cursorIndexOfTimeTs = CursorUtil.getColumnIndexOrThrow(_cursor, "timeTs");
          final int _cursorIndexOfBpm = CursorUtil.getColumnIndexOrThrow(_cursor, "bpm");
          final int _cursorIndexOfTzOffsetMin = CursorUtil.getColumnIndexOrThrow(_cursor, "tzOffsetMin");
          final List<PendingHr> _result = new ArrayList<PendingHr>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PendingHr _item;
            final String _tmpRecordUid;
            _tmpRecordUid = _cursor.getString(_cursorIndexOfRecordUid);
            final String _tmpPatientId;
            _tmpPatientId = _cursor.getString(_cursorIndexOfPatientId);
            final String _tmpOriginId;
            _tmpOriginId = _cursor.getString(_cursorIndexOfOriginId);
            final String _tmpDeviceId;
            _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
            final String _tmpTimeTs;
            _tmpTimeTs = _cursor.getString(_cursorIndexOfTimeTs);
            final long _tmpBpm;
            _tmpBpm = _cursor.getLong(_cursorIndexOfBpm);
            final int _tmpTzOffsetMin;
            _tmpTzOffsetMin = _cursor.getInt(_cursorIndexOfTzOffsetMin);
            _item = new PendingHr(_tmpRecordUid,_tmpPatientId,_tmpOriginId,_tmpDeviceId,_tmpTimeTs,_tmpBpm,_tmpTzOffsetMin);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getSpo2(final int limit,
      final Continuation<? super List<PendingSpo2>> $completion) {
    final String _sql = "SELECT * FROM pending_spo2 LIMIT ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, limit);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PendingSpo2>>() {
      @Override
      @NonNull
      public List<PendingSpo2> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRecordUid = CursorUtil.getColumnIndexOrThrow(_cursor, "recordUid");
          final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patientId");
          final int _cursorIndexOfOriginId = CursorUtil.getColumnIndexOrThrow(_cursor, "originId");
          final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
          final int _cursorIndexOfTimeTs = CursorUtil.getColumnIndexOrThrow(_cursor, "timeTs");
          final int _cursorIndexOfSpo2Pct = CursorUtil.getColumnIndexOrThrow(_cursor, "spo2Pct");
          final int _cursorIndexOfTzOffsetMin = CursorUtil.getColumnIndexOrThrow(_cursor, "tzOffsetMin");
          final List<PendingSpo2> _result = new ArrayList<PendingSpo2>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PendingSpo2 _item;
            final String _tmpRecordUid;
            _tmpRecordUid = _cursor.getString(_cursorIndexOfRecordUid);
            final String _tmpPatientId;
            _tmpPatientId = _cursor.getString(_cursorIndexOfPatientId);
            final String _tmpOriginId;
            _tmpOriginId = _cursor.getString(_cursorIndexOfOriginId);
            final String _tmpDeviceId;
            _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
            final String _tmpTimeTs;
            _tmpTimeTs = _cursor.getString(_cursorIndexOfTimeTs);
            final double _tmpSpo2Pct;
            _tmpSpo2Pct = _cursor.getDouble(_cursorIndexOfSpo2Pct);
            final int _tmpTzOffsetMin;
            _tmpTzOffsetMin = _cursor.getInt(_cursorIndexOfTzOffsetMin);
            _item = new PendingSpo2(_tmpRecordUid,_tmpPatientId,_tmpOriginId,_tmpDeviceId,_tmpTimeTs,_tmpSpo2Pct,_tmpTzOffsetMin);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object getDistance(final int limit,
      final Continuation<? super List<PendingDistance>> $completion) {
    final String _sql = "SELECT * FROM pending_distance LIMIT ?";
    final RoomSQLiteQuery _statement = RoomSQLiteQuery.acquire(_sql, 1);
    int _argIndex = 1;
    _statement.bindLong(_argIndex, limit);
    final CancellationSignal _cancellationSignal = DBUtil.createCancellationSignal();
    return CoroutinesRoom.execute(__db, false, _cancellationSignal, new Callable<List<PendingDistance>>() {
      @Override
      @NonNull
      public List<PendingDistance> call() throws Exception {
        final Cursor _cursor = DBUtil.query(__db, _statement, false, null);
        try {
          final int _cursorIndexOfRecordUid = CursorUtil.getColumnIndexOrThrow(_cursor, "recordUid");
          final int _cursorIndexOfPatientId = CursorUtil.getColumnIndexOrThrow(_cursor, "patientId");
          final int _cursorIndexOfOriginId = CursorUtil.getColumnIndexOrThrow(_cursor, "originId");
          final int _cursorIndexOfDeviceId = CursorUtil.getColumnIndexOrThrow(_cursor, "deviceId");
          final int _cursorIndexOfStartTs = CursorUtil.getColumnIndexOrThrow(_cursor, "startTs");
          final int _cursorIndexOfEndTs = CursorUtil.getColumnIndexOrThrow(_cursor, "endTs");
          final int _cursorIndexOfMeters = CursorUtil.getColumnIndexOrThrow(_cursor, "meters");
          final int _cursorIndexOfTzOffsetMin = CursorUtil.getColumnIndexOrThrow(_cursor, "tzOffsetMin");
          final List<PendingDistance> _result = new ArrayList<PendingDistance>(_cursor.getCount());
          while (_cursor.moveToNext()) {
            final PendingDistance _item;
            final String _tmpRecordUid;
            _tmpRecordUid = _cursor.getString(_cursorIndexOfRecordUid);
            final String _tmpPatientId;
            _tmpPatientId = _cursor.getString(_cursorIndexOfPatientId);
            final String _tmpOriginId;
            _tmpOriginId = _cursor.getString(_cursorIndexOfOriginId);
            final String _tmpDeviceId;
            _tmpDeviceId = _cursor.getString(_cursorIndexOfDeviceId);
            final String _tmpStartTs;
            _tmpStartTs = _cursor.getString(_cursorIndexOfStartTs);
            final String _tmpEndTs;
            _tmpEndTs = _cursor.getString(_cursorIndexOfEndTs);
            final long _tmpMeters;
            _tmpMeters = _cursor.getLong(_cursorIndexOfMeters);
            final int _tmpTzOffsetMin;
            _tmpTzOffsetMin = _cursor.getInt(_cursorIndexOfTzOffsetMin);
            _item = new PendingDistance(_tmpRecordUid,_tmpPatientId,_tmpOriginId,_tmpDeviceId,_tmpStartTs,_tmpEndTs,_tmpMeters,_tmpTzOffsetMin);
            _result.add(_item);
          }
          return _result;
        } finally {
          _cursor.close();
          _statement.release();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteSteps(final List<String> uids, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final StringBuilder _stringBuilder = StringUtil.newStringBuilder();
        _stringBuilder.append("DELETE FROM pending_steps WHERE recordUid IN (");
        final int _inputSize = uids.size();
        StringUtil.appendPlaceholders(_stringBuilder, _inputSize);
        _stringBuilder.append(")");
        final String _sql = _stringBuilder.toString();
        final SupportSQLiteStatement _stmt = __db.compileStatement(_sql);
        int _argIndex = 1;
        for (String _item : uids) {
          _stmt.bindString(_argIndex, _item);
          _argIndex++;
        }
        __db.beginTransaction();
        try {
          _stmt.executeUpdateDelete();
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteHr(final List<String> uids, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final StringBuilder _stringBuilder = StringUtil.newStringBuilder();
        _stringBuilder.append("DELETE FROM pending_hr WHERE recordUid IN (");
        final int _inputSize = uids.size();
        StringUtil.appendPlaceholders(_stringBuilder, _inputSize);
        _stringBuilder.append(")");
        final String _sql = _stringBuilder.toString();
        final SupportSQLiteStatement _stmt = __db.compileStatement(_sql);
        int _argIndex = 1;
        for (String _item : uids) {
          _stmt.bindString(_argIndex, _item);
          _argIndex++;
        }
        __db.beginTransaction();
        try {
          _stmt.executeUpdateDelete();
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteSpo2(final List<String> uids, final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final StringBuilder _stringBuilder = StringUtil.newStringBuilder();
        _stringBuilder.append("DELETE FROM pending_spo2 WHERE recordUid IN (");
        final int _inputSize = uids.size();
        StringUtil.appendPlaceholders(_stringBuilder, _inputSize);
        _stringBuilder.append(")");
        final String _sql = _stringBuilder.toString();
        final SupportSQLiteStatement _stmt = __db.compileStatement(_sql);
        int _argIndex = 1;
        for (String _item : uids) {
          _stmt.bindString(_argIndex, _item);
          _argIndex++;
        }
        __db.beginTransaction();
        try {
          _stmt.executeUpdateDelete();
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @Override
  public Object deleteDistance(final List<String> uids,
      final Continuation<? super Unit> $completion) {
    return CoroutinesRoom.execute(__db, true, new Callable<Unit>() {
      @Override
      @NonNull
      public Unit call() throws Exception {
        final StringBuilder _stringBuilder = StringUtil.newStringBuilder();
        _stringBuilder.append("DELETE FROM pending_distance WHERE recordUid IN (");
        final int _inputSize = uids.size();
        StringUtil.appendPlaceholders(_stringBuilder, _inputSize);
        _stringBuilder.append(")");
        final String _sql = _stringBuilder.toString();
        final SupportSQLiteStatement _stmt = __db.compileStatement(_sql);
        int _argIndex = 1;
        for (String _item : uids) {
          _stmt.bindString(_argIndex, _item);
          _argIndex++;
        }
        __db.beginTransaction();
        try {
          _stmt.executeUpdateDelete();
          __db.setTransactionSuccessful();
          return Unit.INSTANCE;
        } finally {
          __db.endTransaction();
        }
      }
    }, $completion);
  }

  @NonNull
  public static List<Class<?>> getRequiredConverters() {
    return Collections.emptyList();
  }
}
