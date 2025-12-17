package com.vitalink.connect;

import androidx.annotation.NonNull;
import androidx.room.DatabaseConfiguration;
import androidx.room.InvalidationTracker;
import androidx.room.RoomDatabase;
import androidx.room.RoomOpenHelper;
import androidx.room.migration.AutoMigrationSpec;
import androidx.room.migration.Migration;
import androidx.room.util.DBUtil;
import androidx.room.util.TableInfo;
import androidx.sqlite.db.SupportSQLiteDatabase;
import androidx.sqlite.db.SupportSQLiteOpenHelper;
import java.lang.Class;
import java.lang.Override;
import java.lang.String;
import java.lang.SuppressWarnings;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import javax.annotation.processing.Generated;

@Generated("androidx.room.RoomProcessor")
@SuppressWarnings({"unchecked", "deprecation"})
public final class LocalDb_Impl extends LocalDb {
  private volatile PendingDao _pendingDao;

  @Override
  @NonNull
  protected SupportSQLiteOpenHelper createOpenHelper(@NonNull final DatabaseConfiguration config) {
    final SupportSQLiteOpenHelper.Callback _openCallback = new RoomOpenHelper(config, new RoomOpenHelper.Delegate(2) {
      @Override
      public void createAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("CREATE TABLE IF NOT EXISTS `pending_steps` (`recordUid` TEXT NOT NULL, `patientId` TEXT NOT NULL, `originId` TEXT NOT NULL, `deviceId` TEXT NOT NULL, `startTs` TEXT NOT NULL, `endTs` TEXT NOT NULL, `count` INTEGER NOT NULL, `tzOffsetMin` INTEGER NOT NULL, PRIMARY KEY(`recordUid`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `pending_hr` (`recordUid` TEXT NOT NULL, `patientId` TEXT NOT NULL, `originId` TEXT NOT NULL, `deviceId` TEXT NOT NULL, `timeTs` TEXT NOT NULL, `bpm` INTEGER NOT NULL, `tzOffsetMin` INTEGER NOT NULL, PRIMARY KEY(`recordUid`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `pending_spo2` (`recordUid` TEXT NOT NULL, `patientId` TEXT NOT NULL, `originId` TEXT NOT NULL, `deviceId` TEXT NOT NULL, `timeTs` TEXT NOT NULL, `spo2Pct` REAL NOT NULL, `tzOffsetMin` INTEGER NOT NULL, PRIMARY KEY(`recordUid`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS `pending_distance` (`recordUid` TEXT NOT NULL, `patientId` TEXT NOT NULL, `originId` TEXT NOT NULL, `deviceId` TEXT NOT NULL, `startTs` TEXT NOT NULL, `endTs` TEXT NOT NULL, `meters` INTEGER NOT NULL, `tzOffsetMin` INTEGER NOT NULL, PRIMARY KEY(`recordUid`))");
        db.execSQL("CREATE TABLE IF NOT EXISTS room_master_table (id INTEGER PRIMARY KEY,identity_hash TEXT)");
        db.execSQL("INSERT OR REPLACE INTO room_master_table (id,identity_hash) VALUES(42, 'a9f097480ce88fbb8be094b27b7f0551')");
      }

      @Override
      public void dropAllTables(@NonNull final SupportSQLiteDatabase db) {
        db.execSQL("DROP TABLE IF EXISTS `pending_steps`");
        db.execSQL("DROP TABLE IF EXISTS `pending_hr`");
        db.execSQL("DROP TABLE IF EXISTS `pending_spo2`");
        db.execSQL("DROP TABLE IF EXISTS `pending_distance`");
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onDestructiveMigration(db);
          }
        }
      }

      @Override
      public void onCreate(@NonNull final SupportSQLiteDatabase db) {
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onCreate(db);
          }
        }
      }

      @Override
      public void onOpen(@NonNull final SupportSQLiteDatabase db) {
        mDatabase = db;
        internalInitInvalidationTracker(db);
        final List<? extends RoomDatabase.Callback> _callbacks = mCallbacks;
        if (_callbacks != null) {
          for (RoomDatabase.Callback _callback : _callbacks) {
            _callback.onOpen(db);
          }
        }
      }

      @Override
      public void onPreMigrate(@NonNull final SupportSQLiteDatabase db) {
        DBUtil.dropFtsSyncTriggers(db);
      }

      @Override
      public void onPostMigrate(@NonNull final SupportSQLiteDatabase db) {
      }

      @Override
      @NonNull
      public RoomOpenHelper.ValidationResult onValidateSchema(
          @NonNull final SupportSQLiteDatabase db) {
        final HashMap<String, TableInfo.Column> _columnsPendingSteps = new HashMap<String, TableInfo.Column>(8);
        _columnsPendingSteps.put("recordUid", new TableInfo.Column("recordUid", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("patientId", new TableInfo.Column("patientId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("originId", new TableInfo.Column("originId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("deviceId", new TableInfo.Column("deviceId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("startTs", new TableInfo.Column("startTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("endTs", new TableInfo.Column("endTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("count", new TableInfo.Column("count", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSteps.put("tzOffsetMin", new TableInfo.Column("tzOffsetMin", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPendingSteps = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPendingSteps = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPendingSteps = new TableInfo("pending_steps", _columnsPendingSteps, _foreignKeysPendingSteps, _indicesPendingSteps);
        final TableInfo _existingPendingSteps = TableInfo.read(db, "pending_steps");
        if (!_infoPendingSteps.equals(_existingPendingSteps)) {
          return new RoomOpenHelper.ValidationResult(false, "pending_steps(com.vitalink.connect.PendingSteps).\n"
                  + " Expected:\n" + _infoPendingSteps + "\n"
                  + " Found:\n" + _existingPendingSteps);
        }
        final HashMap<String, TableInfo.Column> _columnsPendingHr = new HashMap<String, TableInfo.Column>(7);
        _columnsPendingHr.put("recordUid", new TableInfo.Column("recordUid", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("patientId", new TableInfo.Column("patientId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("originId", new TableInfo.Column("originId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("deviceId", new TableInfo.Column("deviceId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("timeTs", new TableInfo.Column("timeTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("bpm", new TableInfo.Column("bpm", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingHr.put("tzOffsetMin", new TableInfo.Column("tzOffsetMin", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPendingHr = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPendingHr = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPendingHr = new TableInfo("pending_hr", _columnsPendingHr, _foreignKeysPendingHr, _indicesPendingHr);
        final TableInfo _existingPendingHr = TableInfo.read(db, "pending_hr");
        if (!_infoPendingHr.equals(_existingPendingHr)) {
          return new RoomOpenHelper.ValidationResult(false, "pending_hr(com.vitalink.connect.PendingHr).\n"
                  + " Expected:\n" + _infoPendingHr + "\n"
                  + " Found:\n" + _existingPendingHr);
        }
        final HashMap<String, TableInfo.Column> _columnsPendingSpo2 = new HashMap<String, TableInfo.Column>(7);
        _columnsPendingSpo2.put("recordUid", new TableInfo.Column("recordUid", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("patientId", new TableInfo.Column("patientId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("originId", new TableInfo.Column("originId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("deviceId", new TableInfo.Column("deviceId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("timeTs", new TableInfo.Column("timeTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("spo2Pct", new TableInfo.Column("spo2Pct", "REAL", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingSpo2.put("tzOffsetMin", new TableInfo.Column("tzOffsetMin", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPendingSpo2 = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPendingSpo2 = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPendingSpo2 = new TableInfo("pending_spo2", _columnsPendingSpo2, _foreignKeysPendingSpo2, _indicesPendingSpo2);
        final TableInfo _existingPendingSpo2 = TableInfo.read(db, "pending_spo2");
        if (!_infoPendingSpo2.equals(_existingPendingSpo2)) {
          return new RoomOpenHelper.ValidationResult(false, "pending_spo2(com.vitalink.connect.PendingSpo2).\n"
                  + " Expected:\n" + _infoPendingSpo2 + "\n"
                  + " Found:\n" + _existingPendingSpo2);
        }
        final HashMap<String, TableInfo.Column> _columnsPendingDistance = new HashMap<String, TableInfo.Column>(8);
        _columnsPendingDistance.put("recordUid", new TableInfo.Column("recordUid", "TEXT", true, 1, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("patientId", new TableInfo.Column("patientId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("originId", new TableInfo.Column("originId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("deviceId", new TableInfo.Column("deviceId", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("startTs", new TableInfo.Column("startTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("endTs", new TableInfo.Column("endTs", "TEXT", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("meters", new TableInfo.Column("meters", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        _columnsPendingDistance.put("tzOffsetMin", new TableInfo.Column("tzOffsetMin", "INTEGER", true, 0, null, TableInfo.CREATED_FROM_ENTITY));
        final HashSet<TableInfo.ForeignKey> _foreignKeysPendingDistance = new HashSet<TableInfo.ForeignKey>(0);
        final HashSet<TableInfo.Index> _indicesPendingDistance = new HashSet<TableInfo.Index>(0);
        final TableInfo _infoPendingDistance = new TableInfo("pending_distance", _columnsPendingDistance, _foreignKeysPendingDistance, _indicesPendingDistance);
        final TableInfo _existingPendingDistance = TableInfo.read(db, "pending_distance");
        if (!_infoPendingDistance.equals(_existingPendingDistance)) {
          return new RoomOpenHelper.ValidationResult(false, "pending_distance(com.vitalink.connect.PendingDistance).\n"
                  + " Expected:\n" + _infoPendingDistance + "\n"
                  + " Found:\n" + _existingPendingDistance);
        }
        return new RoomOpenHelper.ValidationResult(true, null);
      }
    }, "a9f097480ce88fbb8be094b27b7f0551", "0aa1343205708d9308a2ec0b2f5d4d8e");
    final SupportSQLiteOpenHelper.Configuration _sqliteConfig = SupportSQLiteOpenHelper.Configuration.builder(config.context).name(config.name).callback(_openCallback).build();
    final SupportSQLiteOpenHelper _helper = config.sqliteOpenHelperFactory.create(_sqliteConfig);
    return _helper;
  }

  @Override
  @NonNull
  protected InvalidationTracker createInvalidationTracker() {
    final HashMap<String, String> _shadowTablesMap = new HashMap<String, String>(0);
    final HashMap<String, Set<String>> _viewTables = new HashMap<String, Set<String>>(0);
    return new InvalidationTracker(this, _shadowTablesMap, _viewTables, "pending_steps","pending_hr","pending_spo2","pending_distance");
  }

  @Override
  public void clearAllTables() {
    super.assertNotMainThread();
    final SupportSQLiteDatabase _db = super.getOpenHelper().getWritableDatabase();
    try {
      super.beginTransaction();
      _db.execSQL("DELETE FROM `pending_steps`");
      _db.execSQL("DELETE FROM `pending_hr`");
      _db.execSQL("DELETE FROM `pending_spo2`");
      _db.execSQL("DELETE FROM `pending_distance`");
      super.setTransactionSuccessful();
    } finally {
      super.endTransaction();
      _db.query("PRAGMA wal_checkpoint(FULL)").close();
      if (!_db.inTransaction()) {
        _db.execSQL("VACUUM");
      }
    }
  }

  @Override
  @NonNull
  protected Map<Class<?>, List<Class<?>>> getRequiredTypeConverters() {
    final HashMap<Class<?>, List<Class<?>>> _typeConvertersMap = new HashMap<Class<?>, List<Class<?>>>();
    _typeConvertersMap.put(PendingDao.class, PendingDao_Impl.getRequiredConverters());
    return _typeConvertersMap;
  }

  @Override
  @NonNull
  public Set<Class<? extends AutoMigrationSpec>> getRequiredAutoMigrationSpecs() {
    final HashSet<Class<? extends AutoMigrationSpec>> _autoMigrationSpecsSet = new HashSet<Class<? extends AutoMigrationSpec>>();
    return _autoMigrationSpecsSet;
  }

  @Override
  @NonNull
  public List<Migration> getAutoMigrations(
      @NonNull final Map<Class<? extends AutoMigrationSpec>, AutoMigrationSpec> autoMigrationSpecs) {
    final List<Migration> _autoMigrations = new ArrayList<Migration>();
    return _autoMigrations;
  }

  @Override
  public PendingDao dao() {
    if (_pendingDao != null) {
      return _pendingDao;
    } else {
      synchronized(this) {
        if(_pendingDao == null) {
          _pendingDao = new PendingDao_Impl(this);
        }
        return _pendingDao;
      }
    }
  }
}
